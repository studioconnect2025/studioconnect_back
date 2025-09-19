// src/chat/chat.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/guard/ws-auth.guard'; // Revisa que la ruta sea correcta
import { BookingsService } from 'src/bookings/bookings.service';
import { ChatService } from './chat.service';
import { BookingStatus } from 'src/bookings/enum/enums-bookings';

@UseGuards(WsAuthGuard) 
@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly chatService: ChatService,
  ) {}

  // 👇 LA CORRECIÓN ESTÁ AQUÍ 👇
  // Hacemos este método más seguro. Solo registraremos el ID del cliente.
  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<{ status: string; messages: any[] }> {
    // Aquí 'client.data.user' SÍ existe porque el Guard ya se ejecutó.
    const user = client.data.user; 
    this.logger.log(`Usuario ${user.email} intentando unirse a la sala de la reserva: ${bookingId}`);

    try {
      const booking = await this.bookingsService.findOneForChat(bookingId);

      const isMusician = booking.musician.id === user.id;
      const isOwner = booking.studio.owner.id === user.id;

      if (!isMusician && !isOwner) {
        throw new Error('No tienes permiso para acceder a este chat.');
      }
      
      if (booking.status !== BookingStatus.CONFIRMED) {
          throw new Error('El chat solo está disponible para reservas confirmadas.');
      }

      const roomName = `booking-${bookingId}`;
      client.join(roomName);
      this.logger.log(`Usuario ${user.email} se unió a la sala ${roomName}`);

      const messages = await this.chatService.getMessagesForBooking(bookingId);
      return { status: 'ok', messages };
    } catch (error) {
        // 👇 ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ AQUÍ 👇
        console.log('----------- DETALLES DEL ERROR AL UNIRSE A SALA -----------', error);

        this.logger.error(`Error al unirse a la sala: ${error.message}`);
        client.emit('error', { message: 'No se pudo unir a la sala.', reason: error.message });
        return { status: 'error', messages: [] };
      }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: { bookingId: string; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client.data.user;
    const { bookingId, content } = payload;
    const roomName = `booking-${bookingId}`;

    if (!client.rooms.has(roomName)) {
        client.emit('error', { message: 'No estás en la sala correcta para enviar este mensaje.' });
        return;
    }
    
    try {
        const booking = await this.bookingsService.findOneForChat(bookingId);
        const newMessage = await this.chatService.createMessage({ content }, user, booking);

        this.server.to(roomName).emit('newMessage', newMessage);
    } catch(error) {
        this.logger.error(`Error al enviar mensaje: ${error.message}`);
        client.emit('error', { message: 'Error al procesar el mensaje.' });
    }
  }
}