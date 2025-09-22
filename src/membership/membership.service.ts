import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MembershipPlan, MembershipStatus } from './enum/enum.membership';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { Studio } from 'src/studios/entities/studio.entity';
import { Membership } from './entities/membership.entity';
import { Cron } from '@nestjs/schedule';
import { EmailService } from 'src/auth/services/email.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Studio)
    private readonly studioRepository: Repository<Studio>,
    private readonly emailService: EmailService,
  ) {}

  async getAllMemberships({
    page,
    limit,
    status,
    studioId,
  }: {
    page: number;
    limit: number;
    status?: string;
    studioId?: string;
  }) {
    const query = this.membershipRepository
      .createQueryBuilder('membership')
      .leftJoinAndSelect('membership.studio', 'studio');

    if (status) query.andWhere('membership.status = :status', { status });
    if (studioId) query.andWhere('studio.id = :studioId', { studioId });

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('membership.startDate', 'DESC')
      .getManyAndCount();

    return { items, total, page, limit };
  }

  // Registrar intención de compra (INACTIVE hasta que pague)
  async create(dto: CreateMembershipDto, owner: User): Promise<Membership> {
    const studio = await this.studioRepository.findOne({
      where: { id: owner.studio.id },
      relations: ['owner'],
    });

    if (!studio) throw new NotFoundException('Estudio no encontrado');
    if (studio.owner.id !== owner.id) {
      throw new ForbiddenException(
        'No puedes comprar membresías para otro estudio',
      );
    }

    // Validar si ya hay una pendiente o activa del mismo plan
    const existing = await this.membershipRepository.findOne({
      where: {
        studio: { id: studio.id },
        plan: dto.plan,
        status: MembershipStatus.ACTIVE,
        endDate: MoreThan(new Date()),
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya tienes una membresía activa del tipo ${dto.plan}`,
      );
    }

    const membership = this.membershipRepository.create({
      studio,
      plan: dto.plan,
      status: MembershipStatus.INACTIVE,
      paymentId: dto.paymentId,
    });

    return await this.membershipRepository.save(membership);
  }

  // Activación desde payments al confirmar pago
  async activateMembership(paymentId: string): Promise<Membership> {
    const membership = await this.membershipRepository.findOne({
      where: { paymentId, status: MembershipStatus.INACTIVE },
      relations: ['studio', 'studio.owner'],
    });

    if (!membership) {
      throw new NotFoundException(
        `No se encontró membresía pendiente para paymentId: ${paymentId}`,
      );
    }

    const start = new Date();
    const end = new Date(start);
    if (membership.plan === MembershipPlan.MONTHLY) {
      end.setMonth(start.getMonth() + 1);
    } else {
      end.setFullYear(start.getFullYear() + 1);
    }

    membership.startDate = start;
    membership.endDate = end;
    membership.status = MembershipStatus.ACTIVE;

    const saved = await this.membershipRepository.save(membership);

    // Notificar por correo
    if (membership.studio.owner?.email) {
      await this.emailService.sendMembershipActivated(
        membership.studio.owner.email,
        {
          plan: saved.plan,
          startDate: saved.startDate,
          endDate: saved.endDate,
          studioName: membership.studio.name,
        },
      );
    }

    return saved;
  }

  // Consulta de membresía activa
  async getActiveMembership(studioId: string): Promise<Membership | null> {
    const memberships = await this.membershipRepository.find({
      where: {
        studio: { id: studioId },
        status: MembershipStatus.ACTIVE,
        endDate: MoreThan(new Date()),
      },
      order: { endDate: 'DESC' },
    });
    return memberships.length > 0 ? memberships[0] : null;
  }

  // Cron para expirar automáticamente
  @Cron('0 0 * * *')
  async handleExpiredMemberships() {
    this.logger.log('Ejecutando CRON para expirar membresías...');
    const now = new Date();
    const activeMemberships = await this.membershipRepository.find({
      where: { status: MembershipStatus.ACTIVE },
      relations: ['studio', 'studio.owner'],
    });

    for (const m of activeMemberships) {
      if (m.endDate <= now) {
        m.status = MembershipStatus.EXPIRED;
        await this.membershipRepository.save(m);

        if (m.studio.owner?.email) {
          await this.emailService.sendMembershipExpired(m.studio.owner.email, {
            plan: m.plan,
            studioName: m.studio.name,
            expiredAt: m.endDate,
          });
        }
      }
    }
  }
}
