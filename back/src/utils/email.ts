import nodemailer from 'nodemailer';

// Configuration for Nodemailer
// In production, these should be in your .env file
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a verification email to a new user.
 * @param email User's email
 * @param token Verification token
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    await transporter.sendMail({
        from: `"TidRod Community" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify your TidRod account',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <h2 style="color: #FF9B51;">Welcome to TidRod!</h2>
                <p>Thank you for joining our travel community. Please verify your email address to get started.</p>
                <a href="${url}" style="display: inline-block; background-color: #FF9B51; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Verify Account</a>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">Or copy and paste this link: <br/> ${url}</p>
            </div>
        `,
    });
}

/**
 * Send a password reset email.
 * @param email User's email
 * @param token Reset token
 */
export async function sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    await transporter.sendMail({
        from: `"TidRod Community" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your TidRod password',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <h2 style="color: #FF9B51;">Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to set a new one.</p>
                <a href="${url}" style="display: inline-block; background-color: #25343F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Reset Password</a>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">This link will expire in 24 hours.</p>
                <p style="font-size: 12px; color: #666;">Or copy and paste this link: <br/> ${url}</p>
            </div>
        `,
    });
}
