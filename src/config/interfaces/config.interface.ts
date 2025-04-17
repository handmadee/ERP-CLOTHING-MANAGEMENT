export interface Config {
  env: string;
  port: number;
  
  database: {
    uri: string;
    name: string;
    options: {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
      keepAlive?: boolean;
      autoIndex?: boolean;
      retryWrites?: boolean;
    };
  };

  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };

  cors: {
    enabled: boolean;
    origin: string[];
    credentials: boolean;
  };

  swagger: {
    enabled: boolean;
    title?: string;
    description?: string;
    version?: string;
    path?: string;
  };

  logging: {
    level: string;
    format: string;
    directory: string;
    maxFiles: string;
    maxSize: string;
  };

  throttle: {
    ttl: number;
    limit: number;
  };

  upload: {
    maxFileSize: number;
    directory: string;
    allowedMimeTypes: string[];
  };

  email: {
    enabled: boolean;
    from: string;
    transport: {
      host: string;
      port: number;
      secure?: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };

  security: {
    bcryptSaltRounds: number;
    rateLimiting: {
      enabled: boolean;
      windowMs: number;
      max: number;
    };
    helmet?: {
      contentSecurityPolicy: boolean;
      crossOriginEmbedderPolicy: boolean;
      expectCt: boolean;
      hidePoweredBy: boolean;
      hsts: boolean;
      noSniff: boolean;
      referrerPolicy: boolean;
      xssFilter: boolean;
    };
  };
} 