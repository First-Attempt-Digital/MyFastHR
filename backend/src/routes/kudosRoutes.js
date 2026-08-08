const express = require('express');
const router = express.Router();
const db = require('../config/db');

const MAX_BADGE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 500;
// EmployeeDashboard renders the whole array with no "load more" and never sends ?limit,
// so the default has to sit above any plausible existing volume or a tenant silently loses
// its older wall (and the client-side department/activity filters would scan a truncated
// list). The cap exists to bound the query, not to paginate the current UI.
const DEFAULT_FEED_LIMIT = 1000;
const MAX_FEED_LIMIT = 2000;

// Create Kudos
router.post('/', async (req, res) => {
    try {
        const { recipient_id, badge, message } = req.body;
        const sender_id = req.user.employee_id;
        // req.company_id comes from tenantFilter and honours super_admin impersonation;
        // req.user.company_id is null for super_admin, which used to persist rows with
        // company_id = NULL that the feed below could then never match.
        const company_id = req.company_id || req.user.company_id;

        if (!recipient_id || !badge) {
            return res.status(400).json({ message: 'Recipient and badge are required.' });
        }

        if (!sender_id) {
            return res.status(400).json({ message: 'Only registered employees can send Kudos.' });
        }

        if (!company_id) {
            return res.status(400).json({ message: 'Company context is required to send Kudos.' });
        }

        if (String(badge).length > MAX_BADGE_LENGTH) {
            return res.status(400).json({ message: `Badge must be ${MAX_BADGE_LENGTH} characters or fewer.` });
        }

        if (message && String(message).length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
        }

        // recipient_id is client-supplied and was never checked: kudos could be addressed to
        // another tenant's employee, whose name the feed join then rendered back.
        const recipient = await db('employees')
            .where({ id: recipient_id, company_id })
            .select('id')
            .first();
        if (!recipient) {
            return res.status(400).json({ message: 'Recipient not found in this organization.' });
        }

        const [id] = await db('employee_kudos').insert({
            company_id,
            sender_id,
            recipient_id: recipient.id,
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
        const company_id = req.company_id || req.user.company_id;

        if (!company_id) {
            return res.json([]);
        }

        const requestedLimit = parseInt(req.query.limit, 10);
        const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
            ? Math.min(requestedLimit, MAX_FEED_LIMIT)
            : DEFAULT_FEED_LIMIT;
        const requestedOffset = parseInt(req.query.offset, 10);
        const offset = Number.isInteger(requestedOffset) && requestedOffset > 0 ? requestedOffset : 0;

        const kudos = await db('employee_kudos')
            .where('employee_kudos.company_id', company_id)
            // Both joins are constrained to the same tenant so a pre-existing row pointing at
            // a foreign employee can't leak that employee's name through the feed.
            .join('employees as sender', function () {
                this.on('employee_kudos.sender_id', 'sender.id')
                    .andOn('sender.company_id', db.raw('?', [company_id]));
            })
            .join('employees as recipient', function () {
                this.on('employee_kudos.recipient_id', 'recipient.id')
                    .andOn('recipient.company_id', db.raw('?', [company_id]));
            })
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
            .orderBy('employee_kudos.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        res.json(kudos);
    } catch (err) {
        console.error('Failed to fetch Kudos list:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
