import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { authConfig } from '../config/env.config';
import { User } from '@prisma/client';

import { AuthRepository } from './auth.repository';
import { UserLoginDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}
  async login(userLoginDto: UserLoginDto, ip: string, userAgent: string) {
    try {
      const userData = await this.authRepository.getUserByPhone(
        userLoginDto.mobileNumber,
      );
      if (!userData) {
        throw new NotFoundException('해당 유저는 존재하지 않습니다.');
      }
      const tokenData = await this.createTokens(
        userData.id,
        userData.grade,
        userData.role,
        ip,
        userAgent,
      );
      return tokenData;
    } catch (error) {
      throw error;
    }
  }

  async createTokens(
    userId: bigint,
    grade: number,
    role: number,
    ip: string,
    userAgent: string,
  ) {
    try {
      let accessTokenPayload: { userId: string; grade: string; role?: string };
      // jwt파싱해도 role확인되지 않도록 일반유저는 role 넣지 않음
      if (role > 0) {
        accessTokenPayload = {
          userId: userId.toString(),
          grade: grade.toString(),
          role: role.toString(),
        };
      } else {
        accessTokenPayload = {
          userId: userId.toString(),
          grade: grade.toString(),
        };
      }
      const accessToken = jwt.sign(
        accessTokenPayload,
        authConfig().ACCESS_JWT_SECRET,
        {
          expiresIn: authConfig().ACCESS_JWT_EXPIRATION,
          audience: authConfig().JWT_AUDIENCE,
          issuer: authConfig().JWT_ISSUER,
        },
      );
      const refreshTokenPayload = { uuid: uuidv4() };
      const refreshToken = jwt.sign(
        refreshTokenPayload,
        authConfig().REFRESH_JWT_SECRET,
        {
          expiresIn: authConfig().REFRESH_JWT_EXPIRATION,
          audience: authConfig().JWT_AUDIENCE,
          issuer: authConfig().JWT_ISSUER,
        },
      );
      await this.authRepository.upsertSession(
        userId,
        refreshToken,
        ip,
        userAgent,
      );
      return { accessToken, refreshToken };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  async updateTokens(userId: bigint, ip: string, userAgent: string) {
    try {
      const userData = await this.authRepository.getUserByUserId(userId);
      if (!userData) {
        throw new NotAcceptableException('존재하지 않는 user입니다.');
      }
      let accessTokenPayload;
      // jwt파싱해도 role확인되지 않도록 일반유저는 role 넣지 않음
      if (userData.role > 0) {
        accessTokenPayload = {
          userId: userId.toString(),
          grade: userData.grade.toString(),
          role: userData.role.toString(),
        };
      } else {
        accessTokenPayload = {
          userId: userId.toString(),
          grade: userData.grade.toString(),
        };
      }
      const newAccessToken = jwt.sign(
        accessTokenPayload,
        authConfig().ACCESS_JWT_SECRET,
        {
          expiresIn: authConfig().ACCESS_JWT_EXPIRATION,
          audience: 'neurocircuit',
          issuer: 'test',
        },
      );
      const refreshTokenPayload = { uuid: uuidv4() };
      const newRefreshToken = jwt.sign(
        refreshTokenPayload,
        authConfig().REFRESH_JWT_SECRET,
        {
          expiresIn: authConfig().REFRESH_JWT_EXPIRATION,
          audience: 'neurocircuit',
          issuer: 'test',
        },
      );
      await this.authRepository.upsertSession(
        userId,
        newRefreshToken,
        ip,
        userAgent,
      );

      return { newAccessToken, newRefreshToken };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async verify(token: string, secret: string, type: string) {
    try {
      if (type === 'refresh') {
        const sessionData = await this.authRepository.getToken(token);
        if (!sessionData) {
          throw new UnauthorizedException('인증 정보가 없습니다.');
        }
        return { userId: sessionData.user_id };
      } else {
        const payload = jwt.verify(token, secret, {
          algorithms: ['HS256'],
        }) as jwt.JwtPayload & User;
        const { userId, role, grade } = payload;
        if (!role) {
          return { userId, grade };
        }
        return { userId, grade, role };
      }
    } catch (err) {
      console.error(err);
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      } else if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Token invalid');
      } else {
        throw new InternalServerErrorException('UnExpected');
      }
    }
  }
}
