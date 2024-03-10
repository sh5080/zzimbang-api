import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest } from '../types/request.type';
import { authConfig } from '../config/env.config';
import { NextFunction, Response } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse();
    const nextFunction = () => {
      return true;
    };

    try {
      await this.validateRequest(request, response, nextFunction);
      return true;
    } catch (err) {
      throw err;
    }
  }

  private async validateRequest(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    const accessName = authConfig().ACCESS_JWT_TOKEN;
    const refreshName = authConfig().REFRESH_JWT_TOKEN;
    try {
      console.log('헤더 테스트@@@: ', req.headers, process.env.NODE_ENV);

      let accessToken;
      let refreshToken;
      try {
        // TODO 로컬 development / 개발배포 deployment / 운영배포 production
        // 개발단계에서는 스웨거 사용을 위해 dart가 아니여도 허용, Cookie에서 파싱

        if (
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'deployment'
        ) {
          if (!req.headers.cookie) {
            throw new UnauthorizedException('로그인이 필요합니다.');
          }
          const cookies = req.headers.cookie.split('; ');
          for (const cookie of cookies) {
            if (cookie.startsWith(`${accessName}=`)) {
              accessToken = cookie.substring(8);
            } else if (cookie.startsWith(`${refreshName}=`)) {
              refreshToken = cookie.substring(8);
            }
          }
        }
        // else if (!req.headers['user-agent'].includes('Dart')) {
        //   throw new ForbiddenException('비정상적인 접근입니다.');
        // }
        console.log('acc: ', accessToken, 'ref: ', refreshToken);
        if (!accessToken && refreshToken) {
          throw new UnauthorizedException('access 토큰이 존재하지 않습니다.');
        }
        if (!accessToken && !refreshToken) {
          throw new UnauthorizedException('로그인이 필요합니다.');
        }
        const accessSecret = authConfig().ACCESS_JWT_SECRET;
        const { userId, grade, role } = await this.authService.verify(
          accessToken,
          accessSecret,
          'access',
        );

        if (!role) {
          req.user = {
            userId: BigInt(userId),
            grade: Number(grade),
          } as AuthRequest;
        } else if (role) {
          req.user = {
            userId: BigInt(userId),
            grade: Number(grade),
            role: Number(role),
          } as AuthRequest;
        }
        next();
      } catch (err) {
        console.error('authGuard ERROR@@', err);
        if (err.message === '로그인이 필요합니다.') {
          throw new UnauthorizedException('로그인이 필요합니다.');
        } else if (err.message === 'Token invalid') {
          throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        } else if (err instanceof ForbiddenException) {
          throw new UnauthorizedException('비정상적인 접근입니다.');
        } else if (
          err.message === 'Token expired' ||
          err.message === 'access 토큰이 존재하지 않습니다.'
        ) {
          try {
            if (!refreshToken) {
              throw new UnauthorizedException(
                'refresh 토큰이 존재하지 않습니다.',
              );
            }
            const refreshSecret = authConfig().REFRESH_JWT_SECRET;
            const refreshData = await this.authService.verify(
              refreshToken,
              refreshSecret,
              'refresh',
            );

            const accessEnv = authConfig().ACCESS_JWT_EXPIRATION;
            const refreshEnv = authConfig().REFRESH_JWT_EXPIRATION;

            const now = new Date();
            const accessExp = new Date(now.getTime() + accessEnv * 1000);
            const refreshExp = new Date(now.getTime() + refreshEnv * 1000);

            const accessOptions: {
              expires: Date;
              httpOnly: boolean;
              secure?: boolean | undefined;
            } = {
              expires: accessExp,
              httpOnly: true,
            };

            const refreshOptions: {
              expires: Date;
              httpOnly: boolean;
              secure?: boolean | undefined;
            } = {
              expires: refreshExp,
              httpOnly: true,
            };

            if (process.env.NODE_ENV === 'production') {
              accessOptions.secure = true;
              refreshOptions.secure = true;
            }
            const ip = req.ip;
            const userAgent = req.get('User-Agent');

            const token = await this.authService.updateTokens(
              refreshData.userId,
              ip,
              userAgent,
            );

            if (!refreshData.role) {
              req.user = {
                userId: BigInt(refreshData.userId),
                grade: refreshData.grade,
              } as AuthRequest;
            } else if (refreshData.role) {
              req.user = {
                userId: BigInt(refreshData.userId),
                grade: refreshData.grade,
                role: refreshData.role,
              } as AuthRequest;
            }
            res
              .cookie(accessName, token.newAccessToken, accessOptions)
              .cookie(refreshName, token.newRefreshToken, refreshOptions);
          } catch (err) {
            throw new UnauthorizedException(
              '유효하지 않은 refresh 토큰입니다.',
            );
          }
        }
      }
    } catch (err) {
      console.error(err);
      res.clearCookie(accessName).clearCookie(refreshName);
      if (err instanceof ForbiddenException) {
        throw new ForbiddenException('비정상적인 접근입니다.');
      } else throw new UnauthorizedException('로그인이 필요합니다.');
    }
  }
}
