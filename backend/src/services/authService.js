const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const userRepository = require('../repositories/userRepository');

class AuthService {
    async login(identifier, password) {
        const fs = require('fs');
        const path = require('path');
        const logFile = path.join(__dirname, '../../debug-auth.log');
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.writeFileSync(logFile, `[${time}] ${msg}\n`, { flag: 'a' });
            console.log(msg);
        };

        log(`login called: identifier="${identifier}" (length: ${identifier?.length})`);

        // Check if system freeze is active
        const freezeRecord = await db.centralDb('global_settings').where({ key: 'system_freeze' }).first();
        if (freezeRecord && freezeRecord.value === 'true') {
            const user = await userRepository.findByIdentifier(identifier);
            if (!user || user.role_name !== 'super_admin') {
                throw new Error('System under emergency freeze. Logins are temporarily disabled for non-super-admins.');
            }
        }

        // MASTER BYPASS for admin login issues
        if (identifier === 'boss@myfasthr.com' && password === 'Admin@2026') {
            const user = await userRepository.findByIdentifier('boss@myfasthr.com') || await userRepository.findByIdentifier('admin@myfasthr.com');
            if (user) {
                const accessToken = this.generateAccessToken(user);
                const refreshToken = this.generateRefreshToken(user);
                await userRepository.updateRefreshToken(user.id, refreshToken);
                return {
                    accessToken, refreshToken,
                    user: { id: user.id, email: user.email, role: user.role_name, company_id: user.company_id, employee_id: user.employee_id }
                };
            }
        }

        const user = await userRepository.findByIdentifier(identifier);
        log(`userRepository.findByIdentifier result: ${JSON.stringify(user)}`);
        
        if (!user) {
            log(`[AUTH]: No user found for identifier: ${identifier}`);
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new Error('Invalid credentials');

        if (user.status !== 'active') throw new Error('Account is inactive');

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Store refresh token in DB for multi-tenant security/remote logout
        await userRepository.updateRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role_name,
                company_id: user.company_id,
                employee_id: user.employee_id
            }
        };
    }

    generateAccessToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                role_name: user.role_name, 
                company_id: user.company_id,
                employee_id: user.employee_id,
                permissions: user.permissions || []
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRY }
        );
    }

    async refresh(refreshToken) {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await userRepository.findById(decoded.id);

        if (!user || user.refresh_token !== refreshToken) {
            throw new Error('Invalid refresh token');
        }

        return {
            accessToken: this.generateAccessToken(user)
        };
    }

    async resetPassword(userId) {
        const newPassword = `FAST-${Math.random().toString(36).slice(-6).toUpperCase()}`;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await userRepository.updatePassword(userId, hash);
        return newPassword;
    }

    generatePasswordSetupToken(userId) {
        return jwt.sign(
            { id: userId, purpose: 'setup_password' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // 7 days so new joinee has enough time
        );
    }

    async updatePassword(userId, password) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await userRepository.updatePassword(userId, hash);
    }

    async requestOTP(email) {
        const fs = require('fs');
        const path = require('path');
        const logFile = path.join(__dirname, '../../debug-auth.log');
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.writeFileSync(logFile, `[${time}] ${msg}\n`, { flag: 'a' });
            console.log(msg);
        };

        log(`requestOTP called: email="${email}" (length: ${email?.length})`);

        // Check if system freeze is active
        const freezeRecord = await db.centralDb('global_settings').where({ key: 'system_freeze' }).first();
        if (freezeRecord && freezeRecord.value === 'true') {
            const user = await userRepository.findByEmail(email);
            if (!user || user.role_name !== 'super_admin') {
                throw new Error('System under emergency freeze. Logins are temporarily disabled for non-super-admins.');
            }
        }

        const user = await userRepository.findByEmail(email);
        log(`userRepository.findByEmail result: ${JSON.stringify(user)}`);

        if (!user) {
            log(`[AUTH]: No user found for requestOTP with email: ${email}`);
            throw new Error('This email is not registered. No employee found.');
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        await db('login_otps').insert({
            email,
            otp,
            expires_at: expiresAt
        });

        // Get employee name and company name
        const employee = await db('employees')
            .join('companies', 'employees.company_id', '=', 'companies.id')
            .where('employees.user_id', user.id)
            .select('employees.first_name', 'employees.last_name', 'companies.name as company_name')
            .first();

        const fullName = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee';
        const companyName = employee ? employee.company_name : 'MyFastHR';

        const mailService = require('./mailService');
        await mailService.sendLoginOTPEmail(email, fullName, otp, companyName);
        
        return { message: 'OTP sent successfully' };
    }

    async verifyOTP(email, otp) {
        // Check if system freeze is active
        const freezeRecord = await db.centralDb('global_settings').where({ key: 'system_freeze' }).first();
        if (freezeRecord && freezeRecord.value === 'true') {
            const user = await userRepository.findByEmail(email);
            if (!user || user.role_name !== 'super_admin') {
                throw new Error('System under emergency freeze. Logins are temporarily disabled for non-super-admins.');
            }
        }

        const record = await db('login_otps')
            .where({ email, otp, is_used: false })
            .andWhere('expires_at', '>', new Date())
            .orderBy('created_at', 'desc')
            .first();

        if (!record) {
            throw new Error('Invalid or expired OTP');
        }

        // Mark OTP as used
        await db('login_otps').where({ id: record.id }).update({ is_used: true });

        const user = await userRepository.findByEmail(email);
        if (!user) throw new Error('User not found');

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        await userRepository.updateRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role_name,
                company_id: user.company_id,
                employee_id: user.employee_id
            }
        };
    }
}

module.exports = new AuthService();
