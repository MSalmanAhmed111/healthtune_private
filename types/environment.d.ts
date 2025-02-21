declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Application
      ENVIRONMENT: 'development' | 'production';
      PORT: string;
      APP_PREFIX: string;
      APP_NAME: string;
      DOC_PREFIX: string;

      // JWT
      AT_KEY: string;
      AT_EXPIRY: string;

      // Database
      DB_HOST: string;
      DB_PORT: string;
      DB_USER: string;
      DB_PASS: string;
      DB_NAME: string;

      // Email
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;

      // Storage
      STORAGE_PROVIDER: string;
      STORAGE_PATH: string;

      // Clerk
      CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      CLERK_WEBHOOK_SIGNING_SECRET: string;
    }
  }
}

export {};
