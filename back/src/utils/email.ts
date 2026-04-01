import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a verification email to a new user.
 * @param email User's email
 * @param token Verification token
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const { error } = await resend.emails.send({
        from: 'TidRod <onboarding@resend.dev>', // You should verify your own domain in Resend
        to: email,
        subject: 'Verify your TidRod account',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <h2 style="color: #FF9B51;">Welcome to TidRod!</h2>
                <p>Thank you for joining our travel community. Please verify your email address to get started.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="display: inline-block; background-color: #FF9B51; color: white; padding: 12px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 155, 81, 0.3);">Verify Account</a>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 25px; line-height: 1.5;">If the button doesn't work, copy and paste this link: <br/> 
                <span style="color: #FF9B51;">${url}</span></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">© 2026 TidRod Team. All rights reserved.</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
}

/**
 * Send a password reset email.
 * @param email User's email
 * @param token Reset token
 */
export async function sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const { error } = await resend.emails.send({
        from: 'TidRod <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your TidRod password',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <h2 style="color: #25343F;">Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to set a new one.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="display: inline-block; background-color: #25343F; color: white; padding: 12px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">Reset Password</a>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 25px;">This link will expire in 24 hours.</p>
                <p style="font-size: 13px; color: #666; line-height: 1.5;">Copy and paste this link if the button doesn't work: <br/> 
                <span style="color: #25343F;">${url}</span></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">© 2026 TidRod Team. All rights reserved.</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(`Failed to send reset email: ${error.message}`);
    }
}
