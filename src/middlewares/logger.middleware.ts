import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = process.hrtime();
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const endTime = process.hrtime(startTime);
      const responseTime = endTime[0] * 1e3 + endTime[1] * 1e-6;
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} (${responseTime.toFixed(
          2,
        )} ms)`,
      );
    });

    next();
  }
}
