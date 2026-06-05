const nodemailer = require('nodemailer');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendOnboardingEmail(to, name, onboardingLink, companyName = 'MyFastHR') {
        const cleanCompanyName = companyName.replace(' Enterprise', '').replace('Enterprise', '');
        const mailOptions = {
            from: `"MyFastHR" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Welcome to MyFastHR 🎉`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to MyFastHR 🎉</h2>
                    
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>Congratulations and welcome to <strong>MyFastHR</strong>!</p>
                    
                    <p>We’re excited to begin this journey with you.</p>
                    
                    <p>To get started, please complete your employee onboarding by visiting the secure onboarding portal below:</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0; word-break: break-all;">
                        <span style="font-size: 18px; margin-right: 10px;">👉</span>
                        <a href="${onboardingLink}" style="color: #4f46e5; font-weight: bold; text-decoration: none;">${onboardingLink}</a>
                    </div>
                    
                    <p>The onboarding process will only take a few minutes and helps us prepare everything for your smooth joining experience.</p>
                    
                    <p style="background-color: #fffbeb; color: #92400e; padding: 10px 15px; border-radius: 6px; font-size: 13px;">
                        <strong>Note:</strong> This onboarding link is secure and may expire after 24 Hr.
                    </p>
                    
                    <p>We look forward to working with you.</p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Warm Regards,</p>
                        <p style="margin: 0;">MyFastHR</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`>>> [MAIL]: Onboarding email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending onboarding email to ${to}:`, error.message);
            return false;
        }
    }

    async sendReOnboardingEmail(to, name, onboardingLink, companyName = 'MyFastHR') {
        const cleanCompanyName = companyName.replace(' Enterprise', '').replace('Enterprise', '');
        const mailOptions = {
            from: `"MyFastHR" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Action Required: Onboarding Update for ${cleanCompanyName} 📋`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>We reviewed your onboarding submission for <strong>${cleanCompanyName}</strong>, and it appears that some information or documents were either incomplete or incorrectly submitted.</p>
                    
                    <p>To continue your onboarding process, please re-submit the onboarding form using the secure link below:</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0; word-break: break-all;">
                        <span style="font-size: 18px; margin-right: 10px;">👉</span>
                        <a href="${onboardingLink}" style="color: #4f46e5; font-weight: bold; text-decoration: none;">${onboardingLink}</a>
                    </div>
                    
                    <p>Please make sure to:</p>
                    <ul style="padding-left: 20px;">
                        <li>Upload correct documents</li>
                        <li>Verify bank details carefully</li>
                        <li>Fill all mandatory fields properly</li>
                        <li>Review your information before final submission</li>
                    </ul>
                    
                    <div style="background-color: #fffbeb; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
                        <p style="margin: 0; font-weight: bold;">⚠ Important Note:</p>
                        <p style="margin: 5px 0 0 0;">This onboarding link is secure and will expire within 24 hours for security purposes.</p>
                    </div>
                    
                    <p>If the link expires, please contact the HR team for a new onboarding request.</p>
                    
                    <p>We appreciate your cooperation and look forward to completing your onboarding successfully.</p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Warm Regards,</p>
                        <p style="margin: 0;">HR Team</p>
                        <p style="margin: 0;">${cleanCompanyName}</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`>>> [MAIL]: Re-Onboarding email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending re-onboarding email to ${to}:`, error.message);
            return false;
        }
    }

    async sendApprovalEmail(to, name, employeeId, employeeEmail, setPasswordLink, companyName = 'MyFastHR') {
        const cleanCompanyName = companyName.replace(' Enterprise', '').replace('Enterprise', '');
        const mailOptions = {
            from: `"MyFastHR" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Congratulations 🎉 Your Onboarding for ${cleanCompanyName} is Approved!`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Congratulations 🎉</h2>
                    
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>Your onboarding process for <strong>${cleanCompanyName}</strong> has been successfully reviewed and approved by the HR team.</p>
                    
                    <p>Your employee profile is now active and ready to use.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0;">
                        <h4 style="margin: 0 0 15px 0; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">Employee Login Details</h4>
                        <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${employeeId}</p>
                        <p style="margin: 5px 0;"><strong>Registered Email:</strong> ${employeeEmail}</p>
                    </div>
 
                    <div style="background-color: #fdf2f2; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #fee2e2;">
                        <h4 style="margin: 0 0 10px 0; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">Set Your Password</h4>
                        <p style="margin: 0 0 15px 0; font-size: 14px;">Before logging into the Employee App, please create your account password using the secure link below:</p>
                        <div style="background-color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #fee2e2; word-break: break-all; text-align: center;">
                            <a href="${setPasswordLink}" style="color: #ef4444; font-weight: bold; text-decoration: none; font-size: 15px;">👉 Setup Your Password</a>
                        </div>
                        <p style="margin: 15px 0 0 0; font-size: 11px; color: #b91c1c;">
                            <strong>Important Note:</strong> This password setup link is secure and will expire within 24 hours for security purposes.
                        </p>
                    </div>
 
                    <div style="border-left: 4px solid #4f46e5; padding-left: 20px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">How To Login</h4>
                        <p style="margin: 5px 0; font-size: 14px;">After setting your password:</p>
                        <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                            <li>Open the Employee App</li>
                            <li>Enter your registered email: <strong>${employeeEmail}</strong></li>
                            <li>Enter your password</li>
                            <li>Click Login</li>
                        </ol>
                    </div>
                    
                    <p>If you face any login issues, please contact the HR team.</p>
                    
                    <p style="font-size: 16px; font-weight: bold; color: #4f46e5;">Welcome to ${cleanCompanyName} 🚀</p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Warm Regards,</p>
                        <p style="margin: 0;">HR Team</p>
                        <p style="margin: 0;">${cleanCompanyName}</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
        };
 
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`>>> [MAIL]: Approval email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending approval email to ${to}:`, error.message);
            return false;
        }
    }
 
    async sendRejectionEmail(to, name, reason, companyName = 'MyFastHR') {
        const cleanCompanyName = companyName.replace(' Enterprise', '').replace('Enterprise', '');
        const mailOptions = {
            from: `"MyFastHR" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Onboarding Update: ${cleanCompanyName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>Thank you for completing the onboarding process for <strong>${cleanCompanyName}</strong>.</p>
                    
                    <p>After reviewing your submitted information and documents, we regret to inform you that your onboarding profile could not be approved at this time.</p>
                    
                    <div style="background-color: #fff1f2; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #ffe4e6;">
                        <h4 style="margin: 0 0 10px 0; color: #e11d48; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">Reason For Rejection</h4>
                        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #9f1239;">${reason || 'Incomplete or mismatched information'}</p>
                    </div>
 
                    <p>Possible reasons may include:</p>
                    <ul style="padding-left: 20px;">
                        <li>Incorrect or incomplete documents</li>
                        <li>Mismatched personal information</li>
                        <li>Invalid bank/KYC details</li>
                        <li>Missing mandatory information</li>
                    </ul>
                    
                    <p>If you believe this was a mistake or you would like to continue the onboarding process, please contact the HR team for further assistance.</p>
                    
                    <p>We appreciate your time and cooperation throughout the onboarding process.</p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Regards,</p>
                        <p style="margin: 0;">HR Team</p>
                        <p style="margin: 0;">${cleanCompanyName}</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
        };
 
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`>>> [MAIL]: Rejection email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending rejection email to ${to}:`, error.message);
            return false;
        }
    }

    async sendLoginOTPEmail(to, name, otp, companyName = 'MyFastHR', expiryMinutes = 10) {
        const cleanCompanyName = companyName.replace(' Enterprise', '').replace('Enterprise', '');
        const mailOptions = {
            from: `"MyFastHR Security" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `🔐 Your Login OTP for ${cleanCompanyName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #4f46e5; padding: 24px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Security Verification</h1>
                    </div>
                    <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                        <p>Dear <strong>${name}</strong>,</p>
                        <p>We received a login request for your Employee App account associated with <strong>${cleanCompanyName}</strong>.</p>
                        <p>Use the verification code below to securely log in to your account:</p>
                        
                        <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
                            <span style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; display: block; margin-bottom: 8px;">Your OTP Code</span>
                            <span style="font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 8px;">${otp}</span>
                        </div>

                        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                            <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">⚠️ Security Note:</h4>
                            <ul style="color: #92400e; font-size: 13px; margin: 0; padding-left: 20px;">
                                <li>This OTP is valid for only <strong>${expiryMinutes} minutes</strong>.</li>
                                <li>Do not share this code with anyone.</li>
                                <li>If you did not request this login, please ignore this email immediately.</li>
                            </ul>
                        </div>

                        <p style="font-size: 14px; color: #64748b;">After entering the OTP, you will be securely logged into the Employee App.</p>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                        
                        <p style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Regards,</p>
                        <p style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0;">Security Team</p>
                        <p style="font-size: 14px; color: #1e293b; margin: 0;">${cleanCompanyName}</p>
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Powered by MyFastHR</p>
                    </div>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending OTP to ${to}:`, error.message);
            return false;
        }
    }

    async sendPayslipEmail(to, name, monthName, year, pdfBuffer, filename) {
        const mailOptions = {
            from: `"MyFastHR Payroll" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `📄 Your Payslip for ${monthName} ${year}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Monthly Payslip Issued 📄</h2>
                    
                    <p>Dear <strong>${name}</strong>,</p>
                    
                    <p>We are pleased to inform you that your payslip for the month of <strong>${monthName} ${year}</strong> has been successfully generated and processed.</p>
                    
                    <p>Please find your detailed PDF payslip attached to this email for your records.</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                        <p style="margin: 0; font-size: 13px;"><strong>Filename:</strong> ${filename}</p>
                        <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>Month/Year:</strong> ${monthName} ${year}</p>
                    </div>
                    
                    <p>If you have any questions or require clarifications regarding your salary breakdown, statutory deductions (PF/ESIC/PT), or bonuses, please feel free to reach out to the finance and HR team.</p>
                    
                    <p>Thank you for your hard work and dedication!</p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Warm Regards,</p>
                        <p style="margin: 0;">HR & Accounts Team</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending payslip to ${to}:`, error.message);
            return false;
        }
    }

    async sendOfferLetterEmail(to, name, designation, pdfBuffer, filename) {
        const mailOptions = {
            from: `"MyFastHR Recruitment" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `📄 Offer Letter - ${designation || 'Position'} - ${name || ''}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <h2 style="color: #ef4444; margin-bottom: 20px;">Offer Letter Issued 📄</h2>
                    
                    <p>Dear <strong>${name || 'Candidate'}</strong>,</p>
                    
                    <p>We are pleased to offer you employment with our organization for the position of <strong>${designation || 'Floor Manager'}</strong>.</p>
                    
                    <p>Please find your detailed offer letter attached to this email for your review. Kindly sign and return a duplicate copy of the letter as a token of your acceptance.</p>
                    
                    <p>If you have any questions or require clarifications regarding the terms, please feel free to reach out to the HR team.</p>
                    
                    <p>Welcome aboard, and we look forward to working with you!</p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Warm Regards,</p>
                        <p style="margin: 0;">HR Team</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending offer letter to ${to}:`, error.message);
            return false;
        }
    }

    async sendDeleteKeyResetEmail(to, name, resetLink, companyName = 'MyFastHR') {
        const cleanCompanyName = companyName.replace(' Enterprise', '').replace('Enterprise', '');
        const mailOptions = {
            from: `"MyFastHR Security" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `🔑 Reset Delete Security Key for ${cleanCompanyName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Reset Delete Security Key 🔑</h2>
                    
                    <p>Dear <strong>${name || 'Administrator'}</strong>,</p>
                    
                    <p>We received a request to reset the data deletion security key for <strong>${cleanCompanyName}</strong>.</p>
                    
                    <p>To set a new 6-digit numeric security key, please click the link below to verify your request and access the settings panel:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">👉 Reset Security Key</a>
                    </div>

                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; word-break: break-all;">
                        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #b91c1c;">If the button above does not work, copy and paste this link in your browser:</p>
                        <a href="${resetLink}" style="color: #4f46e5; font-size: 13px; text-decoration: none;">${resetLink}</a>
                    </div>
                    
                    <div style="background-color: #fffbeb; color: #92400e; padding: 10px 15px; border-radius: 6px; font-size: 13px; margin: 20px 0;">
                        <strong>Note:</strong> This link is secure and will expire in 1 Hr. If you did not make this request, you can safely ignore this email.
                    </div>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">Warm Regards,</p>
                        <p style="margin: 0;">MyFastHR Security Team</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Powered by <strong>MyFastHR</strong></p>
                    </div>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`>>> [MAIL]: Delete key reset email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`>>> [MAIL]: Error sending delete key reset email to ${to}:`, error.message);
            return false;
        }
    }
}

module.exports = new MailService();
