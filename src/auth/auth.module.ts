import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { authConfig } from '../config/env.config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [ConfigModule.forFeature(authConfig), PrismaModule],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
