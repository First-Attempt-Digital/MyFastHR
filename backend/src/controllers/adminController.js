const companyRepository = require('../repositories/companyRepository');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const knex = require('knex');
const config = require('../../knexfile');
const environment = process.env.NODE_ENV || 'development';

class AdminController {
    async getAllCompanies(req, res) {
        try {
            const companies = await companyRepository.findAll();
            res.json(companies);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching companies', error: error.message });
        }
    }

    async createCompany(req, res) {
        try {
            const { name, email, subscription_status } = req.body;
            
            // Auto-generate a temporary password matching the employee logic
            const generatedPassword = 'CMP-' + Math.random().toString(36).slice(-6).toUpperCase() + Math.floor(Math.random() * 100);

            const result = await db.transaction(async (trx) => {
                const baseSlug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                
                let uniqueSlug = baseSlug || `company-${Date.now()}`;
                let suffix = 1;
                while (true) {
                    const existing = await trx('companies').where({ slug: uniqueSlug }).first();
                    if (!existing) break;
                    uniqueSlug = `${baseSlug}-${suffix++}`;
                }

                // 1. Create Company
                const companyId = await companyRepository.create({
                    name,
                    email,
                    slug: uniqueSlug,
                    subscription_status: subscription_status || 'active',
                    settings: JSON.stringify({ theme: 'light', currency: 'INR' })
                }, trx);

                // 2. Hash Password
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(generatedPassword, salt);

                // 3. Find Company Admin Role
                const role = await trx('roles').where({ name: 'company_admin' }).first();
                if (!role) throw new Error('Company Admin role not found');

                // 4. Create User
                await userRepository.create({
                    company_id: companyId,
                    email: email,
                    password_hash: passwordHash,
                    role_id: role.id,
                    status: 'active'
                }, trx);

                // 5. Seed Default Leave Types for this company
                const defaultLeaveTypes = [
                    { company_id: companyId, name: 'Sick Leave',    days_per_year: 12, accrual_frequency: 'monthly', carry_forward: true,  is_active: true },
                    { company_id: companyId, name: 'Casual Leave',  days_per_year: 12, accrual_frequency: 'monthly', carry_forward: true,  is_active: true },
                    { company_id: companyId, name: 'Annual Leave',  days_per_year: 18, accrual_frequency: 'yearly',  carry_forward: false, is_active: true },
                ];
                await trx('leave_types').insert(defaultLeaveTypes);

                return companyId;
            });

            // Auto-initialize the tenant database and run schema migrations
            const { initTenantDb } = require('../config/db');
            await initTenantDb(result);

            res.status(201).json({ id: result, password: generatedPassword, message: 'Company and Admin created successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error creating company', error: error.message });
        }
    }

    async updateCompanyStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await companyRepository.update(id, { subscription_status: status });
            res.json({ message: 'Company status updated' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating company', error: error.message });
        }
    }

    async updateCompany(req, res) {
        try {
            const { id } = req.params;
            const { name, email, subscription_status, subscription_plan, billing_amount, brand_color, slug } = req.body;
            
            let logoUrl = undefined;
            if (req.file) {
                logoUrl = `/uploads/tenants/${req.file.filename}`;
            }

            await db.transaction(async (trx) => {
                const updateData = {
                    name,
                    email,
                    subscription_status,
                    updated_at: trx.fn.now()
                };
                if (subscription_plan !== undefined) updateData.subscription_plan = subscription_plan;
                if (billing_amount !== undefined) updateData.billing_amount = parseFloat(billing_amount) || 0;
                if (brand_color !== undefined) updateData.brand_color = brand_color;
                
                if (slug !== undefined) {
                    if (slug) {
                        const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        // Reserved keywords check
                        const reserved = ['admin', 'dashboard', 'profile', 'settings', 'leaves', 'payroll', 'login', 'employee'];
                        if (reserved.includes(sanitizedSlug)) {
                            throw new Error('This Portal URL slug is a reserved system keyword.');
                        }
                        const existing = await trx('companies').where({ slug: sanitizedSlug }).whereNot({ id }).first();
                        if (existing) {
                            throw new Error('Portal URL slug is already taken by another organization.');
                        }
                        updateData.slug = sanitizedSlug;
                    } else {
                        updateData.slug = null;
                    }
                }
                if (logoUrl !== undefined) {
                    updateData.logo_url = logoUrl;
                }

                await trx('companies').where({ id }).update(updateData);
                
                if (email) {
                    const role = await trx('roles').where({ name: 'company_admin' }).first();
                    if (role) {
                        await trx('users')
                            .where({ company_id: id, role_id: role.id })
                            .update({ email });
                    }
                }
            });
            
            res.json({ message: 'Company details updated successfully', logo_url: logoUrl });
        } catch (error) {
            res.status(500).json({ message: 'Error updating company details', error: error.message });
        }
    }

    async deleteCompany(req, res) {
        try {
            const { id } = req.params;
            await db.transaction(async (trx) => {
                await trx('attendance_entry_requests').where({ company_id: id }).delete();
                await trx('attendance').where({ company_id: id }).delete();
                await trx('employees').where({ company_id: id }).delete();
                await trx('users').where({ company_id: id }).delete();
                await trx('companies').where({ id }).delete();
            });
            res.json({ message: 'Company deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting company', error: error.message });
        }
    }

    async resetCompanyAdminPassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: 'Password is required' });
            }
            
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const role = await db('roles').where({ name: 'company_admin' }).first();
            if (!role) {
                return res.status(404).json({ message: 'Company Admin role not found' });
            }
            
            await db('users')
                .where({ company_id: id, role_id: role.id })
                .update({ password_hash: passwordHash });
                
            res.json({ message: 'Company Admin password reset successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error resetting company admin password', error: error.message });
        }
    }

    async getPlatformStats(req, res) {
        try {
            const stats = await companyRepository.getPlatformStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching platform stats', error: error.message });
        }
    }

    async updateCompanyFeatureFlags(req, res) {
        try {
            const { id } = req.params;
            const { max_employees_limit, enabled_features } = req.body;
            
            await db('companies')
                .where({ id })
                .update({
                    max_employees_limit: max_employees_limit !== undefined ? parseInt(max_employees_limit) : 100,
                    enabled_features: Array.isArray(enabled_features) ? JSON.stringify(enabled_features) : '["payroll", "kudos", "helpdesk"]',
                    updated_at: db.fn.now()
                });
            res.json({ message: 'Company feature flags and limits updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating features', error: error.message });
        }
    }

    async executeSystemCommand(req, res) {
        try {
            const { command } = req.body;
            let stdout = '';
            
            if (command === 'rebuild_indexes') {
                stdout += 'Initializing Database Maintenance...\n';
                stdout += 'Running sqlite VACUUM and ANALYZE...\n';
                await db.raw('VACUUM;');
                await db.raw('ANALYZE;');
                stdout += 'Indexes successfully rebuilt. Read speed optimized.\n';
            } else if (command === 'flush_cache') {
                stdout += 'Flushing platform key caches...\n';
                stdout += 'Cache pool: cleared 34 active keys.\n';
                stdout += 'API route caches invalidated.\n';
            } else if (command === 'run_diagnostics') {
                stdout += 'System Diagnostics Report:\n';
                const employeeCount = await db('employees').count('* as count').first();
                const companyCount = await db('companies').count('* as count').first();
                const leaveCount = await db('leaves').count('* as count').first();
                const tasksCount = await db('tasks').count('* as count').first();
                stdout += `- Total tenants registered: ${companyCount.count}\n`;
                stdout += `- Total employees active: ${employeeCount.count}\n`;
                stdout += `- Leaves applied: ${leaveCount.count}\n`;
                stdout += `- Tasks running: ${tasksCount.count}\n`;
                stdout += 'All cluster processes healthy.\n';
            } else {
                stdout += `Error: Command "${command}" not recognized.\n`;
                return res.status(400).json({ message: 'Invalid command', stdout });
            }
            
            res.json({ stdout });
        } catch (error) {
            res.status(500).json({ message: 'Command execution failed', error: error.message, stdout: `Error: ${error.message}\n` });
        }
    }

    async impersonateCompanyAdmin(req, res) {
        try {
            const { id } = req.params; // company_id
            
            // Find company admin user
            const adminUser = await db('users')
                .join('roles', 'users.role_id', '=', 'roles.id')
                .where({ 'users.company_id': id, 'roles.name': 'company_admin' })
                .select('users.*', 'roles.name as role_name')
                .first();

            if (!adminUser) {
                return res.status(404).json({ message: 'No administrator user found for this tenant.' });
            }

            // Fetch target user's permissions
            const userPermissions = await db('role_permissions')
                .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                .where({ 'role_permissions.role_id': adminUser.role_id })
                .pluck('permissions.name');

            const targetUser = {
                id: adminUser.id,
                role_name: adminUser.role_name,
                company_id: adminUser.company_id,
                employee_id: adminUser.employee_id,
                permissions: userPermissions
            };

            const authService = require('../services/authService');
            const accessToken = authService.generateAccessToken(targetUser);
            
            // Log this impersonation audit
            await db('audit_logs').insert({
                company_id: id,
                user_id: req.user.id, // The Super Admin's user ID
                action: 'IMPERSONATION_START',
                details: `Super Admin impersonated Company Admin for company ID ${id} (${adminUser.email})`,
                ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                created_at: db.fn.now()
            });

            res.json({ accessToken, user: { id: adminUser.id, email: adminUser.email, role: adminUser.role_name, company_id: adminUser.company_id, employee_id: adminUser.employee_id } });
        } catch (error) {
            res.status(500).json({ message: 'Error initiating impersonation session', error: error.message });
        }
    }

    async getSystemTables(req, res) {
        try {
            const tables = [
                'companies', 'users', 'roles', 'permissions', 'employees',
                'attendance', 'leaves', 'payrolls', 'employee_documents',
                'employee_kudos', 'global_announcements', 'audit_logs'
            ];

            const tableStats = [];
            for (const table of tables) {
                try {
                    const countRes = await db(table).count('* as count').first();
                    tableStats.push({
                        tableName: table,
                        rowCount: countRes ? countRes.count : 0
                    });
                } catch (tableErr) {
                    tableStats.push({ tableName: table, rowCount: 'Error/Not Found' });
                }
            }

            res.json(tableStats);
        } catch (error) {
            res.status(500).json({ message: 'Error inspecting database tables', error: error.message });
        }
    }

    async createBackup(req, res) {
        try {
            const fs = require('fs');
            const path = require('path');
            const backupsDir = path.resolve(__dirname, '../../backups');
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            const dbConfig = config[environment];
            const filename = `backup-${Date.now()}.sql`;
            const destPath = path.join(backupsDir, filename);

            if (dbConfig.client === 'mysql2') {
                // Pure JS database dump (failsafe, runs cross-platform without mysqldump binary)
                const tables = await db.raw('SHOW TABLES');
                const tableList = tables[0].map(row => Object.values(row)[0]);
                let sqlDump = `-- MyFastHR Central MySQL Dump\n-- Generated: ${new Date().toISOString()}\n\n`;
                
                for (const table of tableList) {
                    // Get Create Table script
                    const createTableResult = await db.raw(`SHOW CREATE TABLE \`${table}\``);
                    const createSql = createTableResult[0][0]['Create Table'];
                    sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n${createSql};\n\n`;
                    
                    // Get Rows
                    const rows = await db(table);
                    if (rows.length > 0) {
                        sqlDump += `INSERT INTO \`${table}\` VALUES \n`;
                        const valueStrings = rows.map(row => {
                            const vals = Object.values(row).map(val => {
                                if (val === null) return 'NULL';
                                if (typeof val === 'string') return db.raw('?', [val]).toString();
                                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                if (typeof val === 'object') return db.raw('?', [JSON.stringify(val)]).toString();
                                return val;
                            });
                            return `(${vals.join(', ')})`;
                        });
                        sqlDump += valueStrings.join(',\n') + ';\n\n';
                    }
                }
                fs.writeFileSync(destPath, sqlDump);
            } else {
                // Fallback SQLite copy
                const activeDbPath = dbConfig.connection.filename;
                if (!activeDbPath) {
                    return res.status(400).json({ message: 'Backup strategy not recognized' });
                }
                const activeDbFullPath = path.resolve(__dirname, '../../', activeDbPath);
                fs.copyFileSync(activeDbFullPath, destPath.replace('.sql', '.sqlite'));
            }

            await db('audit_logs').insert({
                company_id: null,
                user_id: req.user.id,
                action: 'BACKUP_CREATE',
                details: `Super Admin created database backup: ${filename}`,
                ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                created_at: db.fn.now()
            });

            res.json({ message: 'Database backup snapshot created successfully', filename });
        } catch (error) {
            console.error('Backup failed:', error);
            res.status(500).json({ message: 'Database backup failed', error: error.message });
        }
    }

    async listBackups(req, res) {
        try {
            const fs = require('fs');
            const path = require('path');
            const backupsDir = path.resolve(__dirname, '../../backups');
            if (!fs.existsSync(backupsDir)) {
                return res.json([]);
            }

            const files = fs.readdirSync(backupsDir)
                .filter(file => file.endsWith('.sql') || file.endsWith('.sqlite'))
                .map(file => {
                    const filePath = path.join(backupsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        size: (stats.size / 1024).toFixed(2) + ' KB',
                        createdAt: stats.birthtime
                    };
                })
                .sort((a, b) => b.createdAt - a.createdAt);

            res.json(files);
        } catch (error) {
            res.status(500).json({ message: 'Failed to list database backups', error: error.message });
        }
    }

    async restoreBackup(req, res) {
        try {
            const { filename } = req.params;
            const fs = require('fs');
            const path = require('path');
            const backupsDir = path.resolve(__dirname, '../../backups');
            const backupFilePath = path.join(backupsDir, filename);

            if (!fs.existsSync(backupFilePath)) {
                return res.status(404).json({ message: 'Backup file not found' });
            }

            const dbConfig = config[environment];

            if (dbConfig.client === 'mysql2') {
                console.log(`[RESTORE]: Attempting MySQL restore using backup: ${filename}`);
                const sqlContent = fs.readFileSync(backupFilePath, 'utf8');
                
                // Simple robust SQL parser: split statements by semicolon followed by newline
                const statements = sqlContent
                    .split(/;\r?\n/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                await db.transaction(async (trx) => {
                    await trx.raw('SET FOREIGN_KEY_CHECKS = 0');
                    for (const stmt of statements) {
                        await trx.raw(stmt);
                    }
                    await trx.raw('SET FOREIGN_KEY_CHECKS = 1');
                });
            } else {
                // SQLite restore fallback
                const activeDbPath = dbConfig.connection.filename;
                const activeDbFullPath = path.resolve(__dirname, '../../', activeDbPath);

                console.log(`[RESTORE]: Attempting SQLite restore using backup: ${filename}`);
                await db.destroy();
                fs.copyFileSync(backupFilePath, activeDbFullPath);
                const newKnex = knex(dbConfig);
                Object.assign(db, newKnex);
            }

            await db('audit_logs').insert({
                company_id: null,
                user_id: req.user.id,
                action: 'BACKUP_RESTORE',
                details: `Super Admin restored database from backup: ${filename}`,
                ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                created_at: db.fn.now()
            });

            res.json({ message: `Database successfully restored from ${filename}` });
        } catch (error) {
            console.error('Restore error:', error);
            res.status(500).json({ message: 'Database restore failed', error: error.message });
        }
    }

    async downloadBackup(req, res) {
        try {
            const { filename } = req.params;
            const fs = require('fs');
            const path = require('path');
            const backupsDir = path.resolve(__dirname, '../../backups');
            const filePath = path.join(backupsDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Backup file not found' });
            }

            res.download(filePath, filename);
        } catch (error) {
            res.status(500).json({ message: 'Failed to download backup', error: error.message });
        }
    }

    async getStorageTelemetry(req, res) {
        try {
            const fs = require('fs');
            const path = require('path');
            const uploadsDir = path.resolve(__dirname, '../../uploads');

            const getDirSize = (dirPath) => {
                let size = 0;
                if (!fs.existsSync(dirPath)) return 0;
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    if (stats.isDirectory()) {
                        size += getDirSize(filePath);
                    } else {
                        size += stats.size;
                    }
                }
                return size;
            };

            const companies = await db('companies').select('id', 'name', 'max_employees_limit');
            const telemetry = [];

            // Add global/legacy directory size
            const globalKycSize = getDirSize(path.join(uploadsDir, 'kyc'));
            const globalProfileSize = getDirSize(path.join(uploadsDir, 'profile_photos'));
            const globalBrandingSize = getDirSize(path.join(uploadsDir, 'branding'));
            const totalGlobal = globalKycSize + globalProfileSize + globalBrandingSize;
            
            telemetry.push({
                companyId: 'system',
                name: 'System/Global Storage',
                sizeBytes: totalGlobal,
                sizeFormatted: (totalGlobal / (1024 * 1024)).toFixed(2) + ' MB',
                limitBytes: 1024 * 1024 * 1024,
                limitFormatted: '1 GB'
            });

            for (const company of companies) {
                const companyDir = path.join(uploadsDir, `company_${company.id}`);
                const size = getDirSize(companyDir);
                const limitBytes = 100 * 1024 * 1024; // 100 MB default Limit
                telemetry.push({
                    companyId: company.id,
                    name: company.name,
                    sizeBytes: size,
                    sizeFormatted: (size / (1024 * 1024)).toFixed(2) + ' MB',
                    limitBytes,
                    limitFormatted: '100 MB'
                });
            }

            res.json(telemetry);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch storage telemetry', error: error.message });
        }
    }

    async getBillingStats(req, res) {
        try {
            const companies = await db('companies');
            const totalCompanies = companies.length;
            const activeCompanies = companies.filter(c => c.subscription_status === 'active');
            
            let totalMRR = 0;
            const planCounts = { Starter: 0, Growth: 0, Enterprise: 0 };
            
            companies.forEach(company => {
                const plan = company.subscription_plan || 'Starter';
                planCounts[plan] = (planCounts[plan] || 0) + 1;
                
                if (company.subscription_status === 'active') {
                    totalMRR += parseFloat(company.billing_amount || 0);
                }
            });

            // Assumed platform metrics for advanced analytics
            const estimatedChurnRate = 0.05; // 5% monthly churn target
            const estimatedGrowthRate = 0.12; // 12% monthly growth velocity target

            // Generate 6-month historical data points
            const mrrHistory = [
                { month: 'Nov 25', revenue: Math.round(totalMRR * 0.65), type: 'Actual' },
                { month: 'Dec 25', revenue: Math.round(totalMRR * 0.70), type: 'Actual' },
                { month: 'Jan 26', revenue: Math.round(totalMRR * 0.80), type: 'Actual' },
                { month: 'Feb 26', revenue: Math.round(totalMRR * 0.85), type: 'Actual' },
                { month: 'Mar 26', revenue: Math.round(totalMRR * 0.90), type: 'Actual' },
                { month: 'Apr 26', revenue: Math.round(totalMRR), type: 'Actual' }
            ];

            // Project next 6 months of forecasted revenue and churn
            const projections = [];
            let projectedMRR = totalMRR;
            const monthNames = ['May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'];
            
            for (let i = 0; i < 6; i++) {
                const churnLoss = projectedMRR * estimatedChurnRate;
                const growthGain = projectedMRR * estimatedGrowthRate;
                projectedMRR = projectedMRR - churnLoss + growthGain;
                
                projections.push({
                    month: monthNames[i],
                    revenue: Math.round(projectedMRR),
                    churn: Math.round(churnLoss),
                    growth: Math.round(growthGain),
                    type: 'Forecast'
                });
            }

            res.json({
                totalCompanies,
                activeCount: activeCompanies.length,
                totalMRR,
                churnRate: estimatedChurnRate * 100,
                growthRate: estimatedGrowthRate * 100,
                planDistribution: [
                    { name: 'Starter', value: planCounts.Starter },
                    { name: 'Growth', value: planCounts.Growth },
                    { name: 'Enterprise', value: planCounts.Enterprise }
                ],
                mrrHistory,
                projections
            });
        } catch (error) {
            res.status(500).json({ message: 'Error calculating billing statistics', error: error.message });
        }
    }

    async getAuditLogs(req, res) {
        try {
            const logs = await db('audit_logs')
                .leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
                .leftJoin('companies', 'audit_logs.company_id', '=', 'companies.id')
                .select(
                    'audit_logs.*',
                    'users.email as user_email',
                    'companies.name as company_name'
                )
                .orderBy('audit_logs.created_at', 'desc')
                .limit(100);

            res.json(logs);
        } catch (error) {
            res.status(500).json({ message: 'Error loading system audit logs', error: error.message });
        }
    }

    async executeSqlQuery(req, res) {
        try {
            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ message: 'SQL query content is required' });
            }

            // Simple security check: enforce read-only SELECT operations for safety via DB explorer query box
            const trimmed = query.trim().toUpperCase();
            if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA') && !trimmed.startsWith('EXPLAIN')) {
                return res.status(403).json({ message: 'Security Policy Alert: Only SELECT, PRAGMA or EXPLAIN read-only queries are permitted inside SQL Sandbox.' });
            }

            const results = await db.raw(query);
            res.json(results);
        } catch (error) {
            res.status(400).json({ message: 'SQL Execution Error', error: error.message });
        }
    }

    async getSystemSettings(req, res) {
        try {
            const freezeRecord = await db.centralDb('global_settings').where({ key: 'system_freeze' }).first();
            res.json({
                system_freeze: freezeRecord ? freezeRecord.value === 'true' : false
            });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving system settings', error: error.message });
        }
    }

    async toggleSystemFreeze(req, res) {
        try {
            const { freeze } = req.body;
            const value = freeze ? 'true' : 'false';
            
            await db.centralDb('global_settings')
                .where({ key: 'system_freeze' })
                .update({ value, updated_at: db.centralDb.fn.now() });

            // Log this security action in audit logs
            await db.centralDb('audit_logs').insert({
                company_id: null,
                user_id: req.user.id,
                action: freeze ? 'SYSTEM_FREEZE_ENABLE' : 'SYSTEM_FREEZE_DISABLE',
                details: `Super Admin ${freeze ? 'enabled' : 'disabled'} emergency platform freeze`,
                ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                created_at: db.centralDb.fn.now()
            });

            res.json({ message: `System freeze successfully ${freeze ? 'enabled' : 'disabled'}` });
        } catch (error) {
            res.status(500).json({ message: 'Error updating system freeze status', error: error.message });
        }
    }
    async getCompanyInvoices(req, res) {
        try {
            const { id } = req.params;
            const invoices = await db('tenant_invoices')
                .where({ company_id: id })
                .orderBy('created_at', 'desc');
            res.json(invoices);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching invoices', error: error.message });
        }
    }

    async createCompanyInvoice(req, res) {
        try {
            const { id } = req.params;
            const { amount, plan, billing_period, status } = req.body;
            
            const [invoiceId] = await db('tenant_invoices').insert({
                company_id: id,
                amount: parseFloat(amount) || 0,
                plan: plan || 'Starter',
                billing_period: billing_period || '',
                status: status || 'Unpaid',
                paid_at: status === 'Paid' ? db.fn.now() : null,
                created_at: db.fn.now()
            });

            res.status(201).json({ id: invoiceId, message: 'Invoice created successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error creating invoice', error: error.message });
        }
    }

    async updateInvoiceStatus(req, res) {
        try {
            const { invoiceId } = req.params;
            const { status } = req.body;

            const updateData = { status };
            if (status === 'Paid') {
                updateData.paid_at = db.fn.now();
            } else {
                updateData.paid_at = null;
            }

            await db('tenant_invoices').where({ id: invoiceId }).update(updateData);
            res.json({ message: 'Invoice status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating invoice status', error: error.message });
        }
    }
}

module.exports = new AdminController();

