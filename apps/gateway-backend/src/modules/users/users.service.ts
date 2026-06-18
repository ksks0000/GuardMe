import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserInput } from './dto/create-user.input';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async usernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return Boolean(user);
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    if (await this.usernameExists(input.username)) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await hashPassword(input.password);
    const kdfSalt = randomBytes(32).toString('base64');

    return this.prisma.user.create({
      data: {
        username: input.username,
        passwordHash,
        kdfSalt,
      },
    });
  }

  async updateLastAuthAt(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastAuthAt: new Date() },
    });
  }

  toPublicProfile(user: User): PublicUserProfileDto {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      lastAuthAt: user.lastAuthAt,
    };
  }
}
