const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const backendDir = path.join(__dirname, 'backend');
const distDir = path.join(frontendDir, 'dist');
const publicDir = path.join(backendDir, 'public');

console.log('--- Deployment Preparation Script ---');

try {
    // 1. Dump the database using local credentials
    console.log('1. Exporting local database to full_db.sql...');
    try {
        execSync(`mysqldump -u root myfasthr_db > "${path.join(backendDir, 'full_db.sql')}"`, { stdio: 'inherit' });
        console.log('   Database exported successfully to backend/full_db.sql');
    } catch (dbError) {
        console.error('   Warning: Could not export database using mysqldump. Ensure MySQL is running or export manually via phpMyAdmin.');
    }

    // 2. Build the frontend
    console.log('\n2. Building the frontend...');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    console.log('   Frontend built successfully.');

    // 3. Move dist to backend/public
    console.log('\n3. Copying frontend build to backend/public...');
    if (fs.existsSync(publicDir)) {
        fs.rmSync(publicDir, { recursive: true, force: true });
    }
    fs.cpSync(distDir, publicDir, { recursive: true });
    console.log('   Copied successfully.');

    // 4. Update backend/.env for production
    console.log('\n4. Updating backend/.env for Hostinger deployment...');
    const envPath = path.join(backendDir, '.env');
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace DB credentials
        envContent = envContent.replace(/DB_HOST=.*/, () => 'DB_HOST=127.0.0.1'); // Hostinger uses 127.0.0.1
        envContent = envContent.replace(/DB_USER=.*/, () => 'DB_USER=u735392253_fast_hr');
        envContent = envContent.replace(/DB_PASSWORD=.*/, () => 'DB_PASSWORD=Lucky@&1523@&');
        envContent = envContent.replace(/DB_NAME=.*/, () => 'DB_NAME=u735392253_fasthr');
        envContent = envContent.replace(/FRONTEND_URL=.*/, () => 'FRONTEND_URL=https://myfasthr.com');
        envContent = envContent.replace(/NODE_ENV=.*/, () => 'NODE_ENV=production');
        
        fs.writeFileSync(envPath, envContent);
        console.log('   .env updated successfully with live credentials.');
    } else {
        console.log('   Warning: backend/.env not found!');
    }
    
    console.log('\n--- SUCCESS! ---');
    console.log('All steps completed! You can now zip the contents of the "backend" folder (excluding node_modules) and upload it to Hostinger.');

} catch (error) {
    console.error('\nAn error occurred during preparation:', error.message);
}
