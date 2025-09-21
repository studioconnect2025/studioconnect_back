import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guard/roles.guard'; // Reutilizamos el RolesGuard si aplica
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { WsAuthGuard } from 'src/auth/guard/ws-auth.guard';

@UseGuards(WsAuthGuard) // Protegemos con el mismo guard de WebSockets
@WebSocketGateway({ namespace: '/pqrs', cors: true })
export class PqrsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PqrsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente de PQR conectado: ${client.id}`);
  }

  // Evento para que un admin se una a la sala de notificaciones
  @Roles(UserRole.ADMIN)// Solo los admins pueden unirse
  @UseGuards(RolesGuard)
  @SubscribeMessage('joinAdminRoom')
  handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
    this.logger.log(`Admin ${client.data.user.email} se unió a la sala de notificaciones de PQRs.`);
    client.join('admin-room');
    return { status: 'ok', message: 'Unido a la sala de administradores.' };
  }
}