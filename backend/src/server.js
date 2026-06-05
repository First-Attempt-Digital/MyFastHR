const fs = require('fs');
const path = require('path');

process.on('uncaughtException', (err) => {
    fs.writeFileSync(path.join(__dirname, '../../crash.log'), `[${new Date().toISOString()}] Uncaught Exception: ${err.message}\n${err.stack}\n`, { flag: 'a' });
    console.error('Fatal Error:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    fs.writeFileSync(path.join(__dirname, '../../crash.log'), `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`, { flag: 'a' });
    console.error('Unhandled Rejection:', reason);
});

const app = require('./app');
const db = require('./config/db');

console.log('>>> [BOOT]: Server Logic Loaded at', new Date().toISOString());

const PORT = process.env.PORT || 5000;

// Startup Directories Ensure
(async () => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadDirs = [
            path.join(__dirname, '../uploads'),
            path.join(__dirname, '../uploads/profile_photos'),
            path.join(__dirname, '../uploads/kyc')
        ];
        uploadDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                console.log(`>>> [SYS]: Creating directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    } catch (e) {
        console.error('>>> [SYS]: Directory creation failed:', e.message);
    }
})();

// Test DB Connection
db.raw('SELECT 1')
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
    console.log(`[System Ready for Onboarding]`);
});
