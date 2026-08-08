const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middlewares/authMiddleware');

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHMENTS_PER_TASK = 10;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.csv', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.zip'
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Store under company_<id>/tasks so the authenticated /uploads/:filename route in
        // app.js can actually resolve these — it only scans company-isolated folders.
        // The old flat uploads/tasks path was unreachable by that route (and unreachable
        // full stop, since `fs` was never required here and this callback always threw).
        const companyId = req.company_id || (req.user && req.user.company_id);
        if (!companyId) {
            return cb(new Error('Company context missing for attachment upload'));
        }
        const absolutePath = path.resolve(__dirname, '../../uploads', `company_${companyId}`, 'tasks');
        try {
            if (!fs.existsSync(absolutePath)) {
                fs.mkdirSync(absolutePath, { recursive: true });
            }
        } catch (err) {
            return cb(err);
        }
        cb(null, absolutePath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_ATTACHMENT_BYTES, files: MAX_ATTACHMENTS_PER_TASK },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
            return cb(new Error(`Attachment type "${ext || 'unknown'}" is not allowed`));
        }
        cb(null, true);
    }
});

// Turns multer's rejections (size/count/type) into a 400 instead of bubbling to the
// generic handler as a 500.
const uploadAttachments = (req, res, next) => {
    upload.array('attachments')(req, res, (err) => {
        if (!err) return next();
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Attachment exceeds the 10 MB limit'
            : err.code === 'LIMIT_FILE_COUNT'
                ? `A task can have at most ${MAX_ATTACHMENTS_PER_TASK} attachments`
                : err.message;
        res.status(400).json({ message });
    });
};

// router.use(authenticateToken, tenantFilter); // Removed as already in app.js

// Get all tasks for the company
router.get('/', async (req, res) => {
    try {
        const companyId = req.company_id;
        const tasks = await db('tasks as t')
            .leftJoin('employees as creator', 't.assigned_by', 'creator.id')
            .where('t.company_id', companyId)
            .select(
                't.*',
                'creator.first_name as creator_first',
                'creator.last_name as creator_last'
            )
            .orderBy('t.created_at', 'desc');

        // Parse JSON fields
        const processedTasks = tasks.map(task => ({
            ...task,
            assignee_ids: task.assignee_ids ? JSON.parse(task.assignee_ids) : [],
            followers: task.followers ? JSON.parse(task.followers) : [],
            attachments: task.attachments ? JSON.parse(task.attachments) : []
        }));

        res.json(processedTasks);
    } catch (err) {
        console.error('>>> [TASKS]: Fetch Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Create a new task with attachments
router.post('/', uploadAttachments, async (req, res) => {
    try {
        const companyId = req.company_id;
        const {
            name, assigned_by, priority, due_date,
            followers, description, checklist, assignee_ids
        } = req.body;

        // Handle uploaded files
        const attachments = (req.files || []).map(f => ({
            name: f.originalname,
            path: f.filename,
            size: f.size
        }));

        // assigned_by comes straight from the client; only honour it if that employee is
        // actually in this tenant, otherwise fall back to the caller.
        let assignedBy = req.user.employee_id;
        if (assigned_by) {
            const owner = await db('employees')
                .where({ id: assigned_by, company_id: companyId })
                .select('id')
                .first();
            if (owner) assignedBy = owner.id;
        }

        const [taskId] = await db('tasks').insert({
            company_id: companyId,
            name,
            assigned_by: assignedBy,
            assignee_ids: assignee_ids || '[]', // Already stringified from frontend if multi
            priority: priority || 'Medium',
            due_date: due_date || null,
            followers: followers || '[]',
            description: description || '',
            checklist: checklist || null,
            attachments: JSON.stringify(attachments),
            created_by: req.user.employee_id,
            status: 'Pending'
        });

        const newTask = await db('tasks').where('id', taskId).first();
        res.status(201).json(newTask);
    } catch (err) {
        console.error('>>> [TASKS]: Create Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const companyId = req.company_id;

        const task = await db('tasks').where({ id, company_id: companyId }).first();
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const assigneeIds = task.assignee_ids ? JSON.parse(task.assignee_ids) : [];
        const isAssignee = assigneeIds.map(Number).includes(Number(req.user.employee_id));

        // Restriction: Employees cannot update task status unless they are assigned to it
        if (req.user.role_name === 'employee' && !isAssignee) {
            return res.status(403).json({ message: 'Forbidden: Status updates are restricted to assigned employees, managers and administrators.' });
        }

        await db('tasks')
            .where({ id, company_id: companyId })
            .update({ status, updated_at: db.fn.now() });

        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a task — mirrors the frontend gate on /admin/tasks (App.jsx `exceptEmployee`),
// which was the only thing restricting this before.
router.delete('/:id', authorize(['super_admin', 'company_admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.company_id;

        const task = await db('tasks').where({ id, company_id: companyId }).first();
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await db('tasks').where({ id, company_id: companyId }).del();
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
