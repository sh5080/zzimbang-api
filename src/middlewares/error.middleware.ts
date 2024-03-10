import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

export const successCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
};

export const errorCode = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  DUPLICATE: 400,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  DB_ERROR: 600,
};

export const SuccessData = (
  statusCode: number,
  message?: string,
  data?: any,
) => {
  if (statusCode === 200 && !message) {
    message = 'success';
  }
  return {
    statusCode,
    message,
    data,
  };
};

export class CommonError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, message: string, detail: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    Object.setPrototypeOf(this, CommonError.prototype);
  }
}
export const successMessage = {
  LOGIN_SUCCESS: 'Login Success',
  CREATE_POST_SUCCESS: 'Create Success',
  READ_POST_SUCCESS: 'Find Success',
  UPDATE_POST_SUCCESS: 'Update Success',
  DELETE_POST_SUCCESS: 'Delete Success',
};

export const errorMessage = {
  NULL_VALUE: 'Nullable Value',
  REGEX_CHECK: 'Regex Check',
  DUPLICATE: 'Duplicated Value',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Already Exists',
  BAD_REQUEST: 'Bad Request',
  UNIQUE_CONSTRAINT_ERROR: 'Unique Constraint Error',
  FORBIDDEN: 'Forbidden',
  UNAUTHORIZED: 'Unauthorized Error',
  INTERNAL_SERVER_ERROR: 'Server Error',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = (exception as any).message.message;
    let detail = 'Unexpected Error';
    console.log('@@@@', exception);
    if (exception instanceof CommonError) {
      status = exception.status;
      message = exception.message;
      detail = exception.detail;
      return response.status(status).json({
        message: detail,
        error: message,
        statusCode: status,
      });
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse() as string;
      if (message.message.includes('JSON at position')) {
        message.message = '정상적인 입력값이 아닙니다.';
      }
      if (Array.isArray(message.message) && message.message.length > 1) {
        // 여러 에러 메시지 중 첫 번째 메시지 사용
        return response.status(status).json({
          message: message.message[0],
          error: message.error,
          statusCode: status,
        });
      }
      return response.status(status).json(message);
    } else if (
      exception instanceof PrismaClientKnownRequestError ||
      exception instanceof PrismaClientValidationError
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'UnExpected Error';
      console.log(exception.message);
      return response
        .status(status)
        .json({ message: message, statusCode: status });
    } else {
      console.error('UnExpected Error: ', exception.message);
      return response.status(status).json({
        error: detail,
        statusCode: status,
      });
    }
  }
}
