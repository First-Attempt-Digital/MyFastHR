const db = require('../config/db');

class AnnouncementsController {
    async getActiveAnnouncements(req, res) {
        try {
            const now = new Date().toISOString();
            const userCompanyId = req.user?.company_id || null;

            // Fetch announcements that have not expired and target the user's tenant or are global
            const query = db('global_announcements')
                .where((builder) => {
                    builder.where('expires_at', '>', now).orWhereNull('expires_at');
                });
                
            if (userCompanyId) {
                query.andWhere((builder) => {
                    builder.where('company_id', userCompanyId).orWhereNull('company_id');
                });
            }

            const announcements = await query.orderBy('created_at', 'desc');
            res.json(announcements);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
        }
    }

    async createAnnouncement(req, res) {
        try {
            const { message, severity, expires_in_hours, company_id } = req.body;
            
            if (!message) {
                return res.status(400).json({ message: 'Message content is required' });
            }

            let expires_at = null;
            if (expires_in_hours) {
                const date = new Date();
                date.setHours(date.getHours() + parseFloat(expires_in_hours));
                expires_at = date.toISOString();
            }

            const id = await db('global_announcements').insert({
                message,
                severity: severity || 'info',
                company_id: company_id ? parseInt(company_id) : null,
                expires_at,
                created_by: req.user?.id || null
            });

            res.status(201).json({ id: id[0], message: 'Announcement broadcasted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create announcement', error: error.message });
        }
    }
    
    async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;
            await db('global_announcements').where({ id }).delete();
            res.json({ message: 'Announcement deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
        }
    }
}

module.exports = new AnnouncementsController();
