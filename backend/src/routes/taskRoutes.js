const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const absolutePath = path.resolve(__dirname, '../../uploads/tasks');
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
        }
        cb(null, absolutePath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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
router.post('/', upload.array('attachments'), async (req, res) => {
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

        const [taskId] = await db('tasks').insert({
            company_id: companyId,
            name,
            assigned_by: assigned_by || req.user.employee_id,
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

// Delete a task
router.delete('/:id', async (req, res) => {
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
