import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${this.configService.get<string>('FROM_NAME', 'StudioConnect')} <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: 'Recuperación de contraseña',
      html: this.getPasswordResetTemplate(resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de recuperación enviado a: ${email}`);
    } catch (error) {
      this.logger.error('Error enviando email de recuperación:', error);
      throw new Error('Error al enviar el email de recuperación');
    }
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperación de contraseña</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer contraseña</a>
            </div>
            <p>Si no puedes hacer clic en el enlace, copia y pega la siguiente URL en tu navegador:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p><strong>Este enlace expirará en 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

 
  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    const mailOptions = {
      from: `${this.configService.get<string>('FROM_NAME', 'StudioConnect')} <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: '¡Bienvenido a StudioConnect!',
      html: this.getWelcomeTemplate(name),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de bienvenida enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email de bienvenida a ${email}:`, error);
      // No lanzamos un error para no interrumpir el flujo de registro si el email falla
    }
  }

  
  private getWelcomeTemplate(name: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Usamos un saludo genérico si el nombre no está disponible
    const greetingName = name ? name : 'nuevo usuario';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a StudioConnect</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #007bff; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Hola, ${greetingName}! Te damos la bienvenida.</h1>
          </div>
          <div class="content">
            <p>Gracias por registrarte en StudioConnect. Estamos muy contentos de tenerte con nosotros.</p>
            <p>Ya puedes empezar a explorar la plataforma y descubrir todo lo que tenemos para ofrecerte.</p>
            <div style="text-align: center;">
              <a href="${frontendUrl}" class="button">Ir a mi cuenta</a>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }


}