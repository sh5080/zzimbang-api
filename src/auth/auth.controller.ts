import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  ValidationPipe,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { successCode } from '../middlewares/error.middleware';
import { AuthService } from '../auth/auth.service';
import { AuthRequest } from '../types/request.type';
import { authConfig } from 'src/config/env.config';
import { UserLoginDto } from './dto/auth.dto';
import { AuthGuard } from './auth.guard';

@ApiTags('로그인')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '로그인 예시',
  })
  @ApiOkResponse({
    description: '로그인',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login Success',
        data: '',
      },
    },
  })
  @Post('/login')
  async login(
    @Body(ValidationPipe) userLoginDto: UserLoginDto,
    @Req()
    req: AuthRequest,
    @Res()
    res: Response,
  ) {
    try {
      const ip = req.ip;
      const userAgent = req.get('User-Agent');
      const tokens = await this.authService.login(userLoginDto, ip, userAgent);

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
      // TODO 서비스의 성격에 따라 cookie로 보낼지 body로 보낼지 결정 필요
      return res
        .cookie('access', tokens.accessToken, accessOptions)
        .cookie('refresh', tokens.refreshToken, refreshOptions)
        .status(successCode.OK)
        .json(tokens);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  @ApiOperation({
    summary: '토큰 체크 예시',
  })
  @ApiOkResponse({
    description: '토큰 체크',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login Success',
        data: '',
      },
    },
  })
  @UseGuards(AuthGuard)
  @Get('/token')
  async token(
    @Req()
    req: AuthRequest,
    @Res()
    res: Response,
  ) {
    try {
      const userId = req.user.userId;
      console.log('여기@@ : ', userId);
      return res.status(successCode.OK).json(userId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
