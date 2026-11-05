import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly isConfigured: boolean = false;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && host !== 'smtp.example.com' && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });
        this.isConfigured = true;
        this.logger.log(`SMTP configured successfully for host: ${host}:${port}`);
      } catch (err: unknown) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${err}`);
      }
    } else {
      this.logger.log(
        'SMTP credentials not fully configured or using defaults. Reset links will be logged to server console.',
      );
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetToken: string, userName: string) {
    const rawFrontend = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3001';
    const frontendUrl = rawFrontend.replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const from = process.env.SMTP_FROM || '"ALPHA CLASSROOM" <no-reply@alphacoding.com>';

    const subject = 'Reset Your ALPHA CLASSROOM Password';
    const textContent = `Hello ${userName},\n\nYou requested a password reset for your ALPHA CLASSROOM account.\nPlease use the link below within the next 15 minutes to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090b14; color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #12162b; border: 1px solid #2a345e; border-radius: 16px; padding: 36px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: 0.5px;">
              ALPHA CLASSROOM
            </div>
          </div>
          
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px; text-align: center;">
            Password Reset Request
          </h2>
          
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Hello <strong>${userName}</strong>,<br/>
            We received a request to reset the password for your account associated with <strong>${toEmail}</strong>.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 12px; word-break: break-all;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #a78bfa;">${resetUrl}</a>
          </p>
          
          <div style="border-top: 1px solid #1e2648; margin-top: 28px; padding-top: 20px; text-align: center; color: #64748b; font-size: 11px;">
            This link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
          </div>
        </div>
      </div>
    `;

    // Always log to console for development, testing, and debugging transparency
    this.logger.log(`\n======================================================`);
    this.logger.log(`[ALPHA CLASSROOM - PASSWORD RESET EMAIL DISPATCH]`);
    this.logger.log(`To: ${toEmail} (${userName})`);
    this.logger.log(`Reset Token: ${resetToken}`);
    this.logger.log(`Reset Link: ${resetUrl}`);
    this.logger.log(`Expires in: 15 minutes`);
    this.logger.log(`======================================================\n`);

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
        return { sent: true, resetUrl };
      } catch (err: unknown) {
        this.logger.error(`Error sending SMTP email to ${toEmail}: ${err}`);
      }
    }

    return { sent: false, resetUrl };
  }
}
