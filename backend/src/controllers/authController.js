const authService = require('../services/authService');

class AuthController {
    async login(req, res) {
        try {
            const { identifier, email, password } = req.body;
            const loginKey = identifier || email;

            if (!loginKey) {
                return res.status(400).json({ message: 'Identity required for synchronization.' });
            }

            console.log(`[AUTH]: Login attempt initiated for node: ${loginKey}`);
            const result = await authService.login(loginKey, password);
            console.log(`[AUTH]: Authentication successful for: ${loginKey}`);
            res.json(result);
        } catch (err) {
            console.error(`[AUTH ERROR]: ${err.message} for node: ${req.body.identifier || req.body.email}`);
            res.status(401).json({ message: err.message });
        }
    }

    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refresh(refreshToken);
            res.json(result);
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    }

    async setPassword(req, res) {
        try {
            const { token, password } = req.body;
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.purpose !== 'setup_password') {
                throw new Error('Invalid token purpose');
            }

            console.log(`[SET-PASSWORD]: Setting password for user_id: ${decoded.id}`);
            await authService.updatePassword(decoded.id, password);
            console.log(`[SET-PASSWORD]: ✅ Password updated successfully for user_id: ${decoded.id}`);
            res.json({ message: 'Password set successfully' });
        } catch (err) {
            console.error(`[AUTH ERROR]: Set password failed: ${err.message}`);
            res.status(401).json({ message: 'Invalid or expired setup link' });
        }
    }

    async requestOTP(req, res) {
        try {
            const { email } = req.body;
            const result = await authService.requestOTP(email);
            res.json(result);
        } catch (err) {
            console.error(`[AUTH ERROR]: OTP Request failed: ${err.message}`);
            res.status(400).json({ message: err.message });
        }
    }

    async verifyOTP(req, res) {
        try {
            const { email, otp } = req.body;
            const result = await authService.verifyOTP(email, otp);
            res.json(result);
        } catch (err) {
            console.error(`[AUTH ERROR]: OTP Verification failed: ${err.message}`);
            res.status(401).json({ message: err.message });
        }
    }

    async changePassword(req, res) {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: 'Password is required' });
            }
            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' });
            }
            const userId = req.user.id;
            console.log(`[CHANGE-PASSWORD]: Changing password for logged-in user_id: ${userId}`);
            await authService.updatePassword(userId, password);
            res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error(`[AUTH ERROR]: Change password failed: ${err.message}`);
            res.status(500).json({ message: 'Failed to update password' });
        }
    }
    async getTenantBranding(req, res) {
        try {
            const { slug } = req.params;
            const db = require('../config/db');
            const tenant = await db('companies').where({ slug: slug.toLowerCase() }).first();
            if (!tenant) {
                return res.status(404).json({ message: 'Tenant not found.' });
            }
            res.json({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                brand_color: tenant.brand_color || '#6366f1',
                logo_url: tenant.logo_url
            });
        } catch (err) {
            console.error(`[AUTH ERROR]: Fetching tenant branding failed: ${err.message}`);
            res.status(500).json({ message: 'Failed to retrieve branding parameters.' });
        }
    }
}

module.exports = new AuthController();
