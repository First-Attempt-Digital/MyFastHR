const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure Multer for Logo and Favicon storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const absolutePath = path.resolve(__dirname, '../../uploads/branding');
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
        }
        cb(null, absolutePath);
    },
    filename: (req, file, cb) => {
        const suffix = Date.now();
        const ext = path.extname(file.originalname);
        const prefix = file.fieldname === 'logo' ? 'logo' : 'favicon';
        cb(null, `${prefix}-${suffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg|ico|x-icon/;
        const ext = path.extname(file.originalname).toLowerCase();
        const isMimeAllowed = allowedTypes.test(file.mimetype) || file.mimetype === 'image/vnd.microsoft.icon' || file.mimetype === 'image/x-icon';
        const isExtAllowed = allowedTypes.test(ext);
        
        if (isMimeAllowed || isExtAllowed) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, JPG, PNG, GIF, SVG, and ICO files are allowed'));
        }
    }
});

class BrandingController {
    // Middleware helper for upload fields
    getUploadMiddleware() {
        return upload.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'favicon', maxCount: 1 }
        ]);
    }

    // Public endpoint: GET /api/public/branding
    async getPublicBranding(req, res) {
        try {
            const settings = await db.centralDb('system_settings')
                .whereIn('key_name', ['logo_url', 'favicon_url', 'logo_height', 'app_name', 'primary_color', 'login_title', 'login_subtitle', 'footer_copyright'])
                .select('key_name', 'value_text');
            
            const freezeRecord = await db.centralDb('global_settings').where({ key: 'system_freeze' }).first();
            const isFrozen = freezeRecord ? freezeRecord.value === 'true' : false;

            const branding = {
                logo_url: '/uploads/branding/logo.png',
                favicon_url: '/uploads/branding/favicon.png',
                logo_height: '36',
                app_name: 'MyFastHR',
                primary_color: '#6366f1',
                login_title: 'Welcome to MyFastHR',
                login_subtitle: 'Access your tenant HR cluster',
                footer_copyright: '© 2026 MyFastHR. All rights reserved.',
                system_freeze: isFrozen
            };

            settings.forEach(s => {
                branding[s.key_name] = s.value_text;
            });

            res.json(branding);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching branding settings', error: error.message });
        }
    }

    // Superadmin endpoint: GET /api/admin/branding
    async getAdminBranding(req, res) {
        try {
            const settings = await db('system_settings')
                .whereIn('key_name', ['logo_url', 'favicon_url', 'logo_height', 'app_name', 'primary_color', 'login_title', 'login_subtitle', 'footer_copyright'])
                .select('key_name', 'value_text');
            
            const branding = {
                logo_url: '/uploads/branding/logo.png',
                favicon_url: '/uploads/branding/favicon.png',
                logo_height: '36',
                app_name: 'MyFastHR',
                primary_color: '#6366f1',
                login_title: 'Welcome to MyFastHR',
                login_subtitle: 'Access your tenant HR cluster',
                footer_copyright: '© 2026 MyFastHR. All rights reserved.'
            };
            settings.forEach(s => {
                branding[s.key_name] = s.value_text;
            });

            res.json(branding);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching admin branding', error: error.message });
        }
    }

    // Superadmin endpoint: POST /api/admin/branding
    async updateBranding(req, res) {
        try {
            const updates = {};
            const files = req.files || {};

            const textKeys = ['logo_height', 'app_name', 'primary_color', 'login_title', 'login_subtitle', 'footer_copyright'];
            for (const key of textKeys) {
                if (req.body[key] !== undefined) {
                    const valueStr = req.body[key].toString();
                    const exists = await db('system_settings').where({ key_name: key }).first();
                    if (exists) {
                        await db('system_settings')
                            .where({ key_name: key })
                            .update({ value_text: valueStr, updated_at: db.fn.now() });
                    } else {
                        await db('system_settings').insert({
                            key_name: key,
                            value_text: valueStr,
                            created_at: db.fn.now(),
                            updated_at: db.fn.now()
                        });
                    }
                    updates[key] = valueStr;
                }
            }

            if (files.logo && files.logo[0]) {
                const logoPath = `/uploads/branding/${files.logo[0].filename}`;
                
                // Optional: Delete old file if it wasn't the default
                const currentLogo = await db('system_settings').where({ key_name: 'logo_url' }).first();
                if (currentLogo && currentLogo.value_text && currentLogo.value_text !== '/uploads/branding/logo.png') {
                    const oldPath = path.join(__dirname, '../..', currentLogo.value_text);
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error deleting old logo:', e); }
                    }
                }

                await db('system_settings')
                    .where({ key_name: 'logo_url' })
                    .update({ value_text: logoPath, updated_at: db.fn.now() });
                updates.logo_url = logoPath;
            }

            if (files.favicon && files.favicon[0]) {
                const faviconPath = `/uploads/branding/${files.favicon[0].filename}`;

                // Optional: Delete old file if it wasn't the default
                const currentFavicon = await db('system_settings').where({ key_name: 'favicon_url' }).first();
                if (currentFavicon && currentFavicon.value_text && currentFavicon.value_text !== '/uploads/branding/favicon.png') {
                    const oldPath = path.join(__dirname, '../..', currentFavicon.value_text);
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error deleting old favicon:', e); }
                    }
                }

                await db('system_settings')
                    .where({ key_name: 'favicon_url' })
                    .update({ value_text: faviconPath, updated_at: db.fn.now() });
                updates.favicon_url = faviconPath;
            }

            res.json({
                message: 'Branding settings updated successfully',
                updates
            });
        } catch (error) {
            res.status(500).json({ message: 'Error updating branding settings', error: error.message });
        }
    }

    // Dynamic Manifest Endpoint
    async getPublicManifest(req, res) {
        try {
             const settings = await db.centralDb('system_settings')
                .whereIn('key_name', ['logo_url', 'favicon_url', 'app_name', 'primary_color'])
                .select('key_name', 'value_text');
            
            const branding = {
                logo_url: '/uploads/branding/logo.png',
                favicon_url: '/uploads/branding/favicon.png',
                app_name: 'MyFastHR',
                primary_color: '#6028D9'
            };
            
            settings.forEach(s => {
                branding[s.key_name] = s.value_text;
            });

            const host = req.headers.host || 'localhost:5000';
            const iconUrl = branding.logo_url || '/uploads/branding/logo.png';
            const iconType = iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

            const faviconUrl = branding.favicon_url || '/uploads/branding/favicon.png';
            const faviconType = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

            res.json({
                short_name: branding.app_name,
                name: `${branding.app_name} - Enterprise Employee Portal`,
                icons: [
                    {
                        src: faviconUrl,
                        type: faviconType,
                        sizes: "192x192 512x512",
                        purpose: "any"
                    },
                    {
                        src: iconUrl,
                        type: iconType,
                        sizes: "192x192 512x512",
                        purpose: "maskable"
                    }
                ],
                start_url: "/",
                background_color: "#ffffff",
                theme_color: branding.primary_color,
                display: "standalone",
                orientation: "portrait"
            });
        } catch (error) {
            res.status(500).json({ message: 'Error generating manifest', error: error.message });
        }
    }
}

module.exports = new BrandingController();
