import * as process from 'process';

export default () => ({
  environment: process.env.ENVIRONMENT,
  port: parseInt(process.env.PORT, 10) || 3000,
  DB: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
  app: {
    name: process.env.APP_NAME,
    url: process.env.APP_URL,
    prefix: process.env.APP_PREFIX,
    docsPrefix: process.env.DOC_PREFIX,
    swaggerAuthUser: process.env.SWAGGER_AUTH_USER,
    swaggerAuthPassword: process.env.SWAGGER_AUTH_PASS,
  },
  jwt: {
    accessTokenKey: process.env.AT_KEY,
    accessExpiry: process.env.AT_EXPIRY,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER,
    path: process.env.STORAGE_PATH,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
  },
  creds: {
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
  },
});
