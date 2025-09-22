import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Booking } from 'src/bookings/dto/bookings.entity';

// Interfaz para estandarizar los detalles de la reserva en las plantillas
interface BookingDetails {
  studioName: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  musicianName?: string;
  musicianEmail?: string;
  studioAddress?: string;
  contactInfo?: string;
  arrivalInstructions?: string;
  rejectionReason?: string;
}

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

  // --- HELPER PRIVADO PARA ENVIAR EMAILS Y MANEJAR ERRORES ---
  private async sendEmail(
    mailOptions: nodemailer.SendMailOptions,
    logContext: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de ${logContext} enviado a: ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de ${logContext} a ${mailOptions.to}:`,
        error,
      );
      // No lanzamos un error para no detener otros procesos
    }
  }

  // --- MÉTODOS DE AUTENTICACIÓN Y BIENVENIDA ---

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: 'Recuperación de contraseña',
      html: this.getPasswordResetTemplate(resetUrl),
    };
    await this.sendEmail(mailOptions, 'recuperación de contraseña').catch(
      (err) => {
        // En este caso específico, sí queremos que el error se propague
        throw new Error('Error al enviar el email de recuperación');
      },
    );
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    // ... (tu plantilla existente va aquí)
    return `
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
    `;
  }

  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: '¡Bienvenido a StudioConnect!',
      html: this.getWelcomeTemplate(name),
    };
    await this.sendEmail(mailOptions, 'bienvenida');
  }

  private getWelcomeTemplate(name: string): string {
    // ... (tu plantilla existente va aquí)
    const greetingName = name || 'nuevo usuario';
    return `<h1>¡Hola, ${greetingName}! Te damos la bienvenida.</h1>`;
  }

  async sendPasswordChangedEmail(to: string): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get('FROM_EMAIL')}>`,
      to,
      subject: 'Confirmación de cambio de contraseña',
      html: `<p>Hola,</p><p>Te confirmamos que tu contraseña ha sido <b>cambiada exitosamente</b>.</p>`,
    };
    await this.sendEmail(mailOptions, 'cambio de contraseña');
  }

  // --- NOTIFICACIONES DEL PROCESO DE RESERVA ---

  // 1. Solicitud enviada (para el músico)
  async sendBookingRequestMusician(
    email: string,
    details: BookingDetails,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: `Hemos recibido tu solicitud de reserva para ${details.studioName}`,
      html: this.getBookingRequestMusicianTemplate(details),
    };
    await this.sendEmail(mailOptions, 'solicitud de reserva al músico');
  }

  private getBookingRequestMusicianTemplate(details: BookingDetails): string {
    return `
      <h1>Tu Reserva está Pendiente de Confirmación</h1>
      <p>Hola,</p>
      <p>Hemos recibido tu solicitud para reservar la sala <strong>${details.roomName}</strong> en <strong>${details.studioName}</strong>. El dueño del estudio la revisará pronto.</p>
      <ul>
        <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
        <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
        <li><strong>Precio Total:</strong> $${details.totalPrice}</li>
      </ul>
      <p>Recibirás otro correo cuando el estado de tu reserva sea actualizado.</p>
    `;
  }

  // 2. Reserva confirmada (para el músico)
  async sendBookingConfirmedEmail(
    email: string,
    details: BookingDetails,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: `¡Tu reserva en ${details.studioName} está confirmada!`,
      html: this.getBookingConfirmedTemplate(details),
    };
    await this.sendEmail(mailOptions, 'confirmación de reserva');
  }

  private getBookingConfirmedTemplate(details: BookingDetails): string {
    return `
      <h1>¡Tu reserva está confirmada!</h1>
      <p>Hola ${details.musicianName || ''},</p>
      <p>Tu reserva para la sala <strong>${details.roomName}</strong> en <strong>${details.studioName}</strong> ha sido aprobada. ¡Prepárate para crear!</p>
      <h2>Detalles de tu reserva:</h2>
      <ul>
        <li><strong>Estudio:</strong> ${details.studioName}</li>
        <li><strong>Dirección:</strong> ${details.studioAddress || 'Revisa en la plataforma'}</li>
        <li><strong>Sala:</strong> ${details.roomName}</li>
        <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
        <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
        <li><strong>Costo Total:</strong> $${details.totalPrice}</li>
      </ul>
      <h2>Información importante:</h2>
      <p><strong>Contacto del estudio:</strong> ${details.contactInfo || 'Contacta a través de la plataforma'}</p>
      <p><strong>Instrucciones de llegada:</strong> ${details.arrivalInstructions || 'No hay instrucciones especiales.'}</p>
    `;
  }

  // 3. Reserva rechazada (para el músico)
  async sendBookingRejectedEmail(
    email: string,
    details: BookingDetails,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: `Novedades sobre tu solicitud de reserva en ${details.studioName}`,
      html: this.getBookingRejectedTemplate(details),
    };
    await this.sendEmail(mailOptions, 'rechazo de reserva');
  }

  private getBookingRejectedTemplate(details: BookingDetails): string {
    const reason = details.rejectionReason
      ? `<p><strong>Motivo del rechazo:</strong> "${details.rejectionReason}"</p>`
      : '';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return `
      <h1>Tu solicitud de reserva no fue aceptada</h1>
      <p>Hola,</p>
      <p>Lamentamos informarte que tu solicitud de reserva para la sala <strong>${details.roomName}</strong> en las siguientes fechas no ha sido aceptada:</p>
      <ul>
        <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
        <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
      </ul>
      ${reason}
      <p>Te invitamos a buscar otras salas u horarios disponibles en nuestra plataforma.</p>
      <a href="${frontendUrl}/studios" class="button">Buscar otros estudios</a>
    `;
  }

  // 4. Recordatorio de reserva (para el músico)
  async sendBookingReminderEmail(
    email: string,
    details: BookingDetails,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: `Recordatorio de tu reserva en ${details.studioName} mañana`,
      html: this.getBookingReminderTemplate(details),
    };
    await this.sendEmail(mailOptions, 'recordatorio de reserva');
  }

  private getBookingReminderTemplate(details: BookingDetails): string {
    return `
      <h1>Recordatorio de tu reserva</h1>
      <p>Hola ${details.musicianName || ''},</p>
      <p>Este es un recordatorio amigable de tu reserva en <strong>${details.studioName}</strong>.</p>
      <h2>Detalles:</h2>
      <ul>
        <li><strong>Dirección:</strong> ${details.studioAddress || 'No especificada'}</li>
        <li><strong>Sala:</strong> ${details.roomName}</li>
        <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
        <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
      </ul>
      <p>¡Te esperamos!</p>
    `;
  }

  // 5. Confirmación de cancelación (para el músico)
  async sendBookingCancellationEmail(
    email: string,
    details: BookingDetails,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: `Confirmación de cancelación de tu reserva`,
      html: this.getBookingCancellationTemplate(details),
    };
    await this.sendEmail(mailOptions, 'cancelación de reserva');
  }

  private getBookingCancellationTemplate(details: BookingDetails): string {
    return `
      <h1>Reserva Cancelada</h1>
      <p>Hola,</p>
      <p>Confirmamos que tu reserva para la sala <strong>${details.roomName}</strong> en <strong>${details.studioName}</strong> ha sido cancelada exitosamente.</p>
      <ul>
        <li><strong>Fecha cancelada:</strong> ${details.startTime.toLocaleString()}</li>
      </ul>
      <p>Si corresponde un reembolso según nuestras políticas, este se procesará en los próximos 5-7 días hábiles.</p>
    `;
  }

  // 6. Reserva modificada (para el músico)
  async sendBookingModifiedEmail(
    email: string,
    details: BookingDetails,
    changes: string,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: email,
      subject: `Tu reserva en ${details.studioName} ha sido modificada`,
      html: this.getBookingModifiedTemplate(details, changes),
    };
    await this.sendEmail(mailOptions, 'modificación de reserva');
  }

  private getBookingModifiedTemplate(
    details: BookingDetails,
    changes: string,
  ): string {
    return `
      <h1>Tu reserva ha sido modificada</h1>
      <p>Hola,</p>
      <p>El dueño del estudio ha realizado cambios en tu reserva para <strong>${details.studioName}</strong>. Por favor, revisa los detalles actualizados:</p>
      <p><strong>Motivo del cambio:</strong> ${changes}</p>
      <h2>Nuevos Detalles:</h2>
      <ul>
        <li><strong>Sala:</strong> ${details.roomName}</li>
        <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
        <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
      </ul>
      <p>Si tienes alguna pregunta, por favor contacta al dueño del estudio.</p>
    `;
  }

  // --- NOTIFICACIONES PARA EL DUEÑO DEL ESTUDIO ---

  async sendBookingRequestOwner(
    ownerEmail: string,
    details: BookingDetails,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `¡Nueva solicitud de reserva para ${details.studioName}!`,
      html: `
        <h1>Nueva Solicitud de Reserva</h1>
        <p>Hola,</p>
        <p>El músico <strong>${details.musicianEmail}</strong> ha solicitado una reserva en tu estudio <strong>${details.studioName}</strong>.</p>
        <ul>
          <li><strong>Sala:</strong> ${details.roomName}</li>
          <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
          <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
          <li><strong>Precio Total:</strong> $${details.totalPrice}</li>
        </ul>
        <p>Por favor, ingresa a tu panel para confirmar o rechazar esta solicitud.</p>
        <a href="${frontendUrl}/dashboard/bookings" class="button">Gestionar Reservas</a>
      `,
    };
    await this.sendEmail(mailOptions, `nueva reserva para ${ownerEmail}`);
  }

  async sendOwnerBookingUpdateAlert(
    ownerEmail: string,
    details: BookingDetails,
    subject: string,
    message: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: subject,
      html: `
        <h1>Actualización de Reserva</h1>
        <p>Hola,</p>
        <p>${message}</p>
        <ul>
          <li><strong>Músico:</strong> ${details.musicianName || details.musicianEmail}</li>
          <li><strong>Sala:</strong> ${details.roomName}</li>
          <li><strong>Horario Anterior:</strong> ${details.startTime.toLocaleString()} - ${details.endTime.toLocaleString()}</li>
        </ul>
        <p>Tu calendario ha sido actualizado.</p>
        <a href="${frontendUrl}/dashboard/bookings" class="button">Ver mis Reservas</a>
      `,
    };
    await this.sendEmail(
      mailOptions,
      `alerta de actualización de reserva para ${ownerEmail}`,
    );
  }

  /**
   * Envía un resumen al dueño cuando una reserva es confirmada.
   */
  async sendOwnerBookingConfirmedNotice(
    ownerEmail: string,
    details: BookingDetails,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `Reserva confirmada para ${details.musicianName}`,
      html: `
        <h1>Reserva Confirmada en tu Calendario</h1>
        <p>Has confirmado exitosamente una reserva para <strong>${details.musicianName}</strong>.</p>
        <h2>Detalles:</h2>
        <ul>
          <li><strong>Sala:</strong> ${details.roomName}</li>
          <li><strong>Inicio:</strong> ${details.startTime.toLocaleString()}</li>
          <li><strong>Fin:</strong> ${details.endTime.toLocaleString()}</li>
          <li><strong>Precio:</strong> $${details.totalPrice}</li>
        </ul>
      `,
    };
    await this.sendEmail(
      mailOptions,
      `aviso de confirmación de reserva para ${ownerEmail}`,
    );
  }

  /**
   * Da la bienvenida al dueño cuando registra su estudio.
   */
  async sendWelcomeStudioEmail(
    ownerEmail: string,
    studioName: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `¡Bienvenido! Tu estudio ${studioName} ha sido registrado.`,
      html: `
        <h1>¡Felicidades, tu estudio ya está en StudioConnect!</h1>
        <p>Hola,</p>
        <p>Tu estudio <strong>${studioName}</strong> ha sido registrado exitosamente en nuestra plataforma.</p>
        <h2>Próximos pasos:</h2>
        <ol>
          <li>Agrega tus salas de ensayo.</li>
          <li>Configura tus horarios y precios.</li>
          <li>Revisa cómo se ve tu perfil público.</li>
        </ol>
        <a href="${frontendUrl}/dashboard" class="button">Ir a mi Panel de Control</a>
      `,
    };
    await this.sendEmail(
      mailOptions,
      `bienvenida de estudio para ${ownerEmail}`,
    );
  }

  /**
   * Confirma al dueño la creación de una nueva sala.
   */
  async sendNewRoomAddedEmail(
    ownerEmail: string,
    studioName: string,
    roomName: string,
    roomId: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `Se ha agregado una nueva sala a ${studioName}.`,
      html: `
        <h1>Nueva Sala Creada</h1>
        <p>La sala "<strong>${roomName}</strong>" ha sido creada exitosamente en tu estudio <strong>${studioName}</strong>.</p>
        <p>Puedes editar sus detalles, añadir instrumentos o subir fotos en cualquier momento.</p>
        <a href="${frontendUrl}/dashboard/rooms/${roomId}" class="button">Ver/Editar Sala</a>
      `,
    };
    await this.sendEmail(mailOptions, `nueva sala añadida para ${ownerEmail}`);
  }

  /**
   * Notificación de seguridad cuando se actualizan datos del estudio o una sala.
   */
  async sendProfileUpdateEmail(
    ownerEmail: string,
    entityType: 'Estudio' | 'Sala',
    entityName: string,
    updatedSection: string,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `Se han actualizado los datos de tu ${entityType.toLowerCase()}`,
      html: `
        <h1>Notificación de Seguridad</h1>
        <p>Te informamos que se han guardado cambios en tu ${entityType.toLowerCase()} <strong>${entityName}</strong>.</p>
        <p><strong>Sección actualizada:</strong> ${updatedSection}.</p>
        <p>Si no reconoces esta actividad, por favor revisa tu cuenta o contacta a soporte de inmediato.</p>
      `,
    };
    await this.sendEmail(
      mailOptions,
      `actualización de perfil para ${ownerEmail}`,
    );
  }

  async sendBookingReminder(
    musicianEmail: string,
    booking: Booking,
    timeRemaining: string,
  ) {
    const subject = `🔔 Recordatorio: Tu reserva es ${timeRemaining}`;
    const html = `
      <h1>¡Hola!</h1>
      <p>Este es un recordatorio amistoso sobre tu próxima reserva.</p>
      <p><strong>Estudio:</strong> ${booking.room.studio.name}</p>
      <p><strong>Sala:</strong> ${booking.room.name}</p>
      <p><strong>Fecha de inicio:</strong> ${booking.startTime.toLocaleString()}</p>
      <p><strong>Fecha de fin:</strong> ${booking.endTime.toLocaleString()}</p>
      <p>¡Te esperamos!</p>
    `;

    // AHORA CONSTRUIMOS EL OBJETO mailOptions ANTES DE LLAMAR a sendEmail
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: musicianEmail,
      subject: subject,
      html: html,
    };

    // Y LLAMAMOS a sendEmail CON LOS DOS ARGUMENTOS CORRECTOS
    await this.sendEmail(
      mailOptions,
      `recordatorio de reserva (${timeRemaining})`,
    );
  }

  async sendPaymentSuccessMusician(
    musicianEmail: string,
    details: BookingDetails,
    paymentIntentId: string,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: musicianEmail,
      subject: `Recibo de tu pago para la reserva en ${details.studioName}`,
      html: `
        <h1>¡Gracias por tu pago!</h1>
        <p>Hola ${details.musicianName || ''},</p>
        <p>Hemos procesado exitosamente tu pago para la reserva en <strong>${details.studioName}</strong>. Tu reserva está confirmada y lista.</p>
        
        <h2>Recibo de Pago</h2>
        <ul>
          <li><strong>ID de Transacción:</strong> ${paymentIntentId}</li>
          <li><strong>Estudio:</strong> ${details.studioName}</li>
          <li><strong>Sala:</strong> ${details.roomName}</li>
          <li><strong>Fecha y Hora:</strong> ${details.startTime.toLocaleString()}</li>
          <li><strong>Monto Total Pagado:</strong> $${details.totalPrice.toFixed(2)}</li>
        </ul>
        <p>¡Esperamos que tengas una sesión increíble!</p>
      `,
    };
    await this.sendEmail(mailOptions, `recibo de pago para ${musicianEmail}`);
  }

  /**
   * Notifica al dueño del estudio que ha recibido el pago de una reserva.
   */
  async sendPaymentReceivedOwner(
    ownerEmail: string,
    details: BookingDetails,
    ownerPayoutAmount: number,
  ): Promise<void> {
    const commission = details.totalPrice - ownerPayoutAmount;
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `¡Has recibido un pago de StudioConnect!`,
      html: `
        <h1>¡Has recibido un pago!</h1>
        <p>Hola,</p>
        <p>Te hemos transferido las ganancias correspondientes a una nueva reserva pagada en tu estudio <strong>${details.studioName}</strong>.</p>
        
        <h2>Desglose de la Transacción</h2>
        <ul>
          <li><strong>Reserva para:</strong> ${details.musicianName || details.musicianEmail}</li>
          <li><strong>Sala:</strong> ${details.roomName}</li>
          <li><strong>Fecha:</strong> ${details.startTime.toLocaleString()}</li>
          <li>----------------------------------</li>
          <li><strong>Monto total pagado por el músico:</strong> $${details.totalPrice.toFixed(2)}</li>
          <li><strong>Comisión de StudioConnect:</strong> -$${commission.toFixed(2)}</li>
          <li><strong>Total transferido a tu cuenta:</strong> <strong>$${ownerPayoutAmount.toFixed(2)}</strong></li>
        </ul>
        <p>Los fondos han sido enviados a tu cuenta de Stripe conectada.</p>
      `,
    };
    await this.sendEmail(
      mailOptions,
      `notificación de pago para ${ownerEmail}`,
    );
  }

  async sendStudioRejectionEmail(
    ownerEmail: string,
    studioName: string,
    rejectionReason: string,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `Actualización sobre tu solicitud para ${studioName}`,
      html: this.getStudioRejectionTemplate(studioName, rejectionReason),
    };
    await this.sendEmail(mailOptions, `rechazo de estudio para ${ownerEmail}`);
  }

  private getStudioRejectionTemplate(
    studioName: string,
    rejectionReason: string,
  ): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return `
      <h1>Tu solicitud para ${studioName} no fue aprobada</h1>
      <p>Hola,</p>
      <p>Lamentamos informarte que, tras una revisión, tu solicitud para registrar el estudio <strong>${studioName}</strong> no ha sido aprobada en este momento.</p>
      
      <h2>Motivo del Rechazo:</h2>
      <div style="padding: 15px; border-left: 4px solid #d9534f; background-color: #f9f2f2; margin: 15px 0;">
        <p style="margin: 0;">${rejectionReason}</p>
      </div>
      
      <p>Te invitamos a actualizar la información de tu estudio abordando los puntos mencionados y volver a enviarlo para su revisión. Puedes editar los datos desde tu panel de control.</p>
      <a href="${frontendUrl}/dashboard/studio" class="button">Editar mi Estudio</a>
    `;
  }

  /**
   * Notifica al destinatario que ha recibido un nuevo mensaje en el chat de una reserva.
   */
  async sendNewMessageNotification(
    recipientEmail: string,
    senderName: string,
    messagePreview: string,
    bookingId: string,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: recipientEmail,
      subject: `Has recibido un nuevo mensaje de ${senderName}`,
      html: this.getNewMessageNotificationTemplate(
        senderName,
        messagePreview,
        bookingId,
      ),
    };
    await this.sendEmail(
      mailOptions,
      `notificación de nuevo mensaje para ${recipientEmail}`,
    );
  }

  private getNewMessageNotificationTemplate(
    senderName: string,
    messagePreview: string,
    bookingId: string,
  ): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Asumimos una ruta como /dashboard/bookings/:id/chat para ver la conversación
    const chatUrl = `${frontendUrl}/dashboard/bookings/${bookingId}?tab=chat`;

    // Acortamos la vista previa si el mensaje es muy largo
    const preview =
      messagePreview.length > 150
        ? messagePreview.substring(0, 147) + '...'
        : messagePreview;

    return `
      <h1>Nuevo Mensaje de ${senderName}</h1>
      <p>Hola,</p>
      <p>Has recibido un nuevo mensaje en la plataforma relacionado con una de tus reservas.</p>
      
      <div style="padding: 15px; border-left: 4px solid #3498db; background-color: #f2f2f2; margin: 15px 0;">
        <p style="margin: 0;"><strong>${senderName} dice:</strong></p>
        <p style="margin: 5px 0 0 0;"><em>"${preview}"</em></p>
      </div>
      
      <p>Puedes ver la conversación completa y responder haciendo clic en el siguiente botón:</p>
      <a href="${chatUrl}" class="button">Responder al Mensaje</a>
    `;
  }

  async sendNewReviewNotification(
    ownerEmail: string,
    musicianName: string,
    studioName: string,
    rating: number,
    comment: string,
    studioId: string,
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: ownerEmail,
      subject: `¡${musicianName} ha calificado tu estudio!`,
      html: this.getNewReviewTemplate(
        musicianName,
        studioName,
        rating,
        comment,
        studioId,
      ),
    };
    await this.sendEmail(
      mailOptions,
      `notificación de nueva reseña para ${ownerEmail}`,
    );
  }

  private getNewReviewTemplate(
    musicianName: string,
    studioName: string,
    rating: number,
    comment: string,
    studioId: string,
  ): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Asumimos una ruta como /studios/:id para ver el estudio y sus reseñas
    const studioUrl = `${frontendUrl}/studios/${studioId}`;

    // Generamos las estrellas para la calificación
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    return `
      <h1>¡Has recibido una nueva reseña para ${studioName}!</h1>
      <p>Hola,</p>
      <p>El músico <strong>${musicianName}</strong> ha dejado una nueva reseña sobre su experiencia en tu estudio.</p>
      
      <h2>Detalles de la Reseña:</h2>
      <div style="padding: 15px; border-left: 4px solid #f0ad4e; background-color: #fcf8e3; margin: 15px 0;">
        <p style="margin: 0;"><strong>Calificación:</strong> ${stars} (${rating}/5)</p>
        <p style="margin: 10px 0 0 0;"><strong>Comentario:</strong></p>
        <p style="margin: 5px 0 0 0;"><em>"${comment}"</em></p>
      </div>
      
      <p>Las reseñas positivas ayudan a que más músicos descubran tu estudio. ¡Sigue así!</p>
      <a href="${studioUrl}" class="button">Ver todas las reseñas de mi estudio</a>
    `;
  }

  // --- NOTIFICACIONES PARA EL ADMINISTRADOR ---
  // ✅ --- INICIO DE NUEVO CÓDIGO --- ✅

  /**
   * Notifica al admin sobre un nuevo estudio que necesita aprobación.
   */
  async sendNewStudioAdminNotification(
    studioName: string,
    ownerEmail: string,
    studioId: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL no está configurado. No se puede enviar la notificación de nuevo estudio.',
      );
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // Asumimos que hay un panel de admin para ver los estudios pendientes
    const reviewUrl = `${frontendUrl}/admin/studios/pending`;

    const mailOptions = {
      from: `StudioConnect Alertas <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: adminEmail,
      subject: `Nuevo estudio registrado: ${studioName}`,
      html: `
        <h1>Nuevo Estudio Requiere Aprobación</h1>
        <p>Un nuevo estudio se ha registrado en la plataforma y está pendiente de revisión.</p>
        <ul>
          <li><strong>Nombre del Estudio:</strong> ${studioName}</li>
          <li><strong>Email del Dueño:</strong> ${ownerEmail}</li>
          <li><strong>ID de Estudio:</strong> ${studioId}</li>
        </ul>
        <p>Por favor, revisa la información y aprueba o rechaza la solicitud desde el panel de administración.</p>
        <a href="${reviewUrl}" class="button">Revisar Solicitudes</a>
      `,
    };
    await this.sendEmail(mailOptions, 'nuevo estudio para admin');
  }

  /**
   * Notifica al admin sobre una nueva disputa (PQRS).
   */
  async sendNewDisputeAdminNotification(
    bookingId: string,
    reporterEmail: string,
    reason: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL no está configurado. No se puede enviar la notificación de disputa.',
      );
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const disputeUrl = `${frontendUrl}/admin/disputes`;

    const mailOptions = {
      from: `StudioConnect Soporte <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: adminEmail,
      subject: 'Se ha generado una PQRS',
      html: `
        <h1>Nueva Disputa (PQRS) Registrada</h1>
        <p>Un usuario ha iniciado un proceso de disputa formal y requiere intervención del equipo de soporte.</p>
        <ul>
          <li><strong>Usuario que reporta:</strong> ${reporterEmail}</li>
          <li><strong>ID de Reserva Afectada:</strong> ${bookingId}</li>
          <li><strong>Motivo:</strong> ${reason}</li>
        </ul>
        <a href="${disputeUrl}" class="button">Gestionar Disputa</a>
      `,
    };
    await this.sendEmail(mailOptions, 'nueva disputa para admin');
  }

  /**
   * Notifica al admin sobre un fallo en el procesamiento de un pago.
   */
  async sendPaymentFailureAdminNotification(
    bookingId: string,
    musicianEmail: string,
    amount: number,
    errorMessage: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL no está configurado. No se puede enviar la notificación de fallo de pago.',
      );
      return;
    }

    const mailOptions = {
      from: `StudioConnect Sistema <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: adminEmail,
      subject: 'Fallo en el pago de una reserva',
      html: `
        <h1>Alerta Técnica: Fallo de Pago</h1>
        <p>Se ha detectado un error al procesar un pago en la plataforma. Se requiere revisión técnica.</p>
        <h2>Detalles del Error:</h2>
        <ul>
          <li><strong>ID de Reserva:</strong> ${bookingId}</li>
          <li><strong>Email del Músico:</strong> ${musicianEmail}</li>
          <li><strong>Monto:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Mensaje de la Pasarela:</strong> ${errorMessage}</li>
        </ul>
        <p>Por favor, investiga el problema con la pasarela de pagos y el estado de la reserva asociada.</p>
      `,
    };
    await this.sendEmail(mailOptions, 'fallo de pago para admin');
  }

  /**
   * Notifica al admin sobre contenido reportado por un usuario.
   */
  async sendContentReportedAdminNotification(
    reportType: 'Reseña' | 'Foto' | 'Perfil',
    contentId: string,
    reporterEmail: string,
    reason: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL no está configurado. No se puede enviar la notificación de contenido reportado.',
      );
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const moderationUrl = `${frontendUrl}/admin/moderation`;

    const mailOptions = {
      from: `StudioConnect Moderación <${this.configService.get<string>('FROM_EMAIL')}>`,
      to: adminEmail,
      subject: 'Contenido reportado por un usuario',
      html: `
        <h1>Alerta de Moderación</h1>
        <p>Un usuario ha reportado contenido como inapropiado. Se necesita revisión.</p>
        <ul>
          <li><strong>Tipo de Contenido:</strong> ${reportType}</li>
          <li><strong>ID del Contenido:</strong> ${contentId}</li>
          <li><strong>Reportado por:</strong> ${reporterEmail}</li>
          <li><strong>Motivo del reporte:</strong> ${reason}</li>
        </ul>
        <a href="${moderationUrl}" class="button">Ir a Moderación</a>
      `,
    };
    await this.sendEmail(mailOptions, 'contenido reportado para admin');
  }

  // --- NOTIFICACIONES DE MEMBRESÍA ---
  async sendMembershipActivated(
    to: string,
    data: { plan: string; startDate: Date; endDate: Date; studioName: string },
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to,
      subject: `¡Tu membresía en ${data.studioName} está activa!`,
      html: `
      <h1>Membresía Activada</h1>
      <p>Hola,</p>
      <p>Tu membresía para el estudio <strong>${data.studioName}</strong> ha sido activada exitosamente.</p>
      <ul>
        <li><strong>Plan:</strong> ${data.plan}</li>
        <li><strong>Fecha de inicio:</strong> ${data.startDate.toLocaleDateString()}</li>
        <li><strong>Fecha de fin:</strong> ${data.endDate.toLocaleDateString()}</li>
      </ul>
      <p>Ahora puedes crear más salas de tu estudio según los beneficios de tu plan.</p>
    `,
    };
    await this.sendEmail(mailOptions, 'activación de membresía');
  }

  async sendMembershipExpired(
    to: string,
    data: { plan: string; studioName: string; expiredAt: Date },
  ): Promise<void> {
    const mailOptions = {
      from: `StudioConnect <${this.configService.get<string>('FROM_EMAIL')}>`,
      to,
      subject: `Tu membresía en ${data.studioName} ha expirado`,
      html: `
      <h1>Membresía Expirada</h1>
      <p>Hola,</p>
      <p>Tu membresía para el estudio <strong>${data.studioName}</strong> ha expirado el ${data.expiredAt.toLocaleDateString()}.</p>
      <p>Recuerda que ya no podrás crear más salas adicionales hasta renovar tu membresía.</p>
    `,
    };
    await this.sendEmail(mailOptions, 'expiración de membresía');
  }
}
