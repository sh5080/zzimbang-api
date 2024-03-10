import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from 'src/utils/swagger';
import * as expressBasicAuth from 'express-basic-auth';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.use(
    ['/docs'],
    expressBasicAuth({
      challenge: true,
      users: { [process.env.SWAGGER_USER]: process.env.SWAGGER_PWD },
    }),
  );
  setupSwagger(app);

  await app.listen(process.env.PORT || 3000);
  Logger.log(`Server is running on ${await app.getUrl()}`);
}
bootstrap();
