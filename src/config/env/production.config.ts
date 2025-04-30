export default () => {
  console.log(`NOT FOUND`);
  console.log(process.env.MONGODB_URI);
  const config = {
    env: 'production',
    port: parseInt(process.env.PORT || '3000', 10),

    database: {
      uri: process.env.MONGODB_URI || '',
      name: process.env.MONGODB_DB_NAME || 'wedding_management',
      primary: {
        uri: process.env.MONGODB_URI || '',
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 75000,
        maxPoolSize: 50,
        minPoolSize: 5,
        keepAlive: true,
        keepAliveInitialDelay: 300000,
        autoIndex: false,
        retryWrites: true,
        retryReads: true,
        writeConcern: {
          w: 'majority',
          j: true,
          wtimeout: 10000,
        },
        readPreference: 'primary',
        readConcern: { level: 'majority' },
      },
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 75000,
        keepAlive: true,
        autoIndex: false,
        retryWrites: true,
      },
    },

    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: '7d',
    },

    cors: {
      enabled: true,
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },

    swagger: {
      enabled: false, // Disable Swagger in production
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'combined',
      directory: 'logs',
      maxFiles: '30d',
      maxSize: '50m',
    },

    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '50', 10), // More restrictive in production
    },

    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      directory: 'uploads/prod',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },

    email: {
      enabled: true,
      from: process.env.EMAIL_FROM || 'no-reply@wedding-management.com',
      transport: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: true,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
    },

    security: {
      bcryptSaltRounds: 12,
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // More restrictive in production
      },
      helmet: {
        contentSecurityPolicy: true,
        crossOriginEmbedderPolicy: true,
        expectCt: true,
        hidePoweredBy: true,
        hsts: true,
        noSniff: true,
        referrerPolicy: true,
        xssFilter: true,
      },
    },
  };

  // Validate required configuration
  if (!config.database.uri) {
    throw new Error('MONGODB_URI is required in production environment');
  }
  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET is required in production environment');
  }
  if (
    !config.email.transport.host ||
    !config.email.transport.auth.user ||
    !config.email.transport.auth.pass
  ) {
    throw new Error('SMTP configuration is required in production environment');
  }

  return config;
};
