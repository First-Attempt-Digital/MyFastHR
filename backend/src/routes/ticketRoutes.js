const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Raise a new ticket
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;
        const employee_id = req.user.employee_id;
        const company_id = req.user.company_id;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }

        const [id] = await db('tickets').insert({
            company_id,
            employee_id,
            title,
            description,
            category: category || 'General',
            priority: priority || 'Medium',
            status: 'Open',
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        res.status(201).json({ id, message: 'Ticket raised successfully!' });
    } catch (err) {
        console.error('Failed to create ticket:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Fetch tickets (filtered by permissions/roles)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const company_id = req.user.company_id;
        const employee_id = req.user.employee_id;
        const role = req.user.role_name; // super_admin, company_admin, manager, employee

        let query = db('tickets as t')
            .leftJoin('employees as creator', 't.employee_id', 'creator.id')
            .leftJoin('employees as assignee', 't.assigned_to', 'assignee.id')
            .select(
                't.*',
                'creator.first_name as creator_first_name',
                'creator.last_name as creator_last_name',
                'assignee.first_name as assignee_first_name',
                'assignee.last_name as assignee_last_name'
            );

        if (role === 'super_admin') {
            // Super admin sees all tickets across all tenants under 'Platform' category
            query = query.where('t.category', 'Platform');
        } else if (role === 'company_admin') {
            // Company admin sees employee tickets (not platform) OR platform tickets raised by themselves
            query = query.where('t.company_id', company_id)
                .andWhere(function() {
                    this.where('t.category', '!=', 'Platform')
                        .orWhere('t.employee_id', employee_id);
                });
        } else if (role === 'manager') {
            query = query.where('t.company_id', company_id).where('t.category', '!=', 'Platform');
        } else {
            // Regular employee only sees their own tickets
            query = query.where('t.employee_id', employee_id);
        }

        const tickets = await query.orderBy('t.created_at', 'desc');
        res.json(tickets);
    } catch (err) {
        console.error('Failed to fetch tickets:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get detailed ticket thread with all replies
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const company_id = req.user.company_id;
        const employee_id = req.user.employee_id;
        const role = req.user.role_name;

        // Fetch ticket metadata
        const ticket = await db('tickets as t')
            .leftJoin('employees as creator', 't.employee_id', 'creator.id')
            .leftJoin('employees as assignee', 't.assigned_to', 'assignee.id')
            .select(
                't.*',
                'creator.first_name as creator_first_name',
                'creator.last_name as creator_last_name',
                'assignee.first_name as assignee_first_name',
                'assignee.last_name as assignee_last_name'
            )
            .where('t.id', id)
            .first();

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        // Access check
        if (role !== 'super_admin') {
            if (ticket.company_id !== company_id) {
                return res.status(403).json({ message: 'Forbidden. You do not have access to this ticket.' });
            }
            if (role === 'employee' && ticket.employee_id !== employee_id) {
                return res.status(403).json({ message: 'Forbidden. You can only view your own tickets.' });
            }
        }

        // Fetch replies
        const replies = await db('ticket_replies as r')
            .leftJoin('employees as sender', 'r.sender_id', 'sender.id')
            .select(
                'r.*',
                'sender.first_name as sender_first_name',
                'sender.last_name as sender_last_name'
            )
            .where('r.ticket_id', id)
            .orderBy('r.created_at', 'asc');

        const processedReplies = replies.map(r => {
            if (r.sender_role === 'super_admin') {
                return {
                    ...r,
                    sender_first_name: 'Super',
                    sender_last_name: 'Admin'
                };
            }
            return r;
        });

        res.json({ ticket, replies: processedReplies });
    } catch (err) {
        console.error('Failed to fetch ticket details:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Add reply to ticket
router.post('/:id/replies', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const employee_id = req.user.employee_id;
        const role = req.user.role_name;

        if (!message) {
            return res.status(400).json({ message: 'Message content is required.' });
        }

        // Fetch ticket to check access
        const ticket = await db('tickets').where('id', id).first();
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        if (role !== 'super_admin') {
            if (ticket.company_id !== req.user.company_id) {
                return res.status(403).json({ message: 'Forbidden.' });
            }
            if (role === 'employee' && ticket.employee_id !== employee_id) {
                return res.status(403).json({ message: 'Forbidden.' });
            }
        }

        await db('ticket_replies').insert({
            ticket_id: id,
            sender_id: employee_id || 0,
            sender_role: role,
            message,
            created_at: db.fn.now()
        });

        // Update ticket updated_at time
        await db('tickets')
            .where('id', id)
            .update({ updated_at: db.fn.now() });

        res.status(201).json({ message: 'Reply posted successfully!' });
    } catch (err) {
        console.error('Failed to post ticket reply:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update ticket status or assignee (Admin/Manager only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assigned_to } = req.body;
        const company_id = req.user.company_id;
        const role = req.user.role_name;

        if (role !== 'super_admin' && role !== 'company_admin' && role !== 'manager') {
            return res.status(403).json({ message: 'Unauthorized to update ticket status/assignee.' });
        }

        const ticket = await db('tickets').where('id', id).first();
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        if (role !== 'super_admin' && ticket.company_id !== company_id) {
            return res.status(403).json({ message: 'Forbidden.' });
        }

        const updateData = { updated_at: db.fn.now() };
        if (status) updateData.status = status;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

        await db('tickets')
            .where('id', id)
            .update(updateData);

        res.json({ message: 'Ticket updated successfully!' });
    } catch (err) {
        console.error('Failed to update ticket:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
