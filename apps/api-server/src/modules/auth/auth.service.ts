import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

type RoleCode = 'admin' | 'staff' | 'customer';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, allowedRoles: RoleCode[]) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Username or password is incorrect');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('User is disabled');
    }

    if (!allowedRoles.includes(user.role.code as RoleCode)) {
      throw new ForbiddenException('No permission to login here');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      roleCode: user.role.code,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '2h'),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
        },
      },
    };
  }

  async getProfile(currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
      },
      status: user.status,
    };
  }

  logout() {
    return { success: true };
  }
}
