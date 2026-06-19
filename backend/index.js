process.env.TZ = 'Asia/Kolkata';
const fs = require('fs');

process.on('uncaughtException', (err) => {
    fs.writeFileSync('crash.log', `[${new Date().toISOString()}] Uncaught Exception: ${err.message}\n${err.stack}\n`, { flag: 'a' });
    console.error('Fatal Error:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    fs.writeFileSync('crash.log', `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`, { flag: 'a' });
    console.error('Unhandled Rejection:', reason);
});

require('./src/server.js');
