const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Kudos
router.post('/', async (req, res) => {
    try {
        const { recipient_id, badge, message } = req.body;
        const sender_id = req.user.employee_id;
        const company_id = req.user.company_id;

        if (!recipient_id || !badge) {
            return res.status(400).json({ message: 'Recipient and badge are required.' });
        }

        if (!sender_id) {
            return res.status(400).json({ message: 'Only registered employees can send Kudos.' });
        }

        const [id] = await db('employee_kudos').insert({
            company_id,
            sender_id,
            recipient_id,
            badge,
            message,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        res.status(201).json({ id, message: 'Kudos sent successfully!' });
    } catch (err) {
        console.error('Failed to create Kudos:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get Kudos for Company Feed
router.get('/', async (req, res) => {
    try {
        const company_id = req.user.company_id;

        const kudos = await db('employee_kudos')
            .where('employee_kudos.company_id', company_id)
            .join('employees as sender', 'employee_kudos.sender_id', 'sender.id')
            .join('employees as recipient', 'employee_kudos.recipient_id', 'recipient.id')
            .select(
                'employee_kudos.id',
                'employee_kudos.sender_id',
                'employee_kudos.recipient_id',
                'employee_kudos.badge',
                'employee_kudos.message',
                'employee_kudos.created_at',
                'sender.first_name as sender_first_name',
                'sender.last_name as sender_last_name',
                'recipient.first_name as recipient_first_name',
                'recipient.last_name as recipient_last_name'
            )
            .orderBy('employee_kudos.created_at', 'desc');

        res.json(kudos);
    } catch (err) {
        console.error('Failed to fetch Kudos list:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
