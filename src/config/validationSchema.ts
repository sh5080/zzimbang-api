import * as Joi from 'joi';

export const validationSchema = Joi.object({
  SWAGGER_USER: Joi.string().required(),
  SWAGGER_PWD: Joi.string().required(),
  DISCORD_WEBHOOK_URL: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),
  PORT: Joi.string().required(),

  ACCESS_JWT_SECRET: Joi.string().required(),
  REFRESH_JWT_SECRET: Joi.string().required(),
  ACCESS_JWT_EXPIRATION: Joi.string().required(),
  REFRESH_JWT_EXPIRATION: Joi.string().required(),
  ACCESS_JWT_TOKEN: Joi.string().required(),
  REFRESH_JWT_TOKEN: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  JWT_ISSUER: Joi.string().required(),
});
