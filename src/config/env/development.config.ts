export default () => {
  const config = {
    env: 'development',
    port: parseInt(process.env.PORT || '3000', 10),

    database: {
      uri:
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/wedding_management_dev',
      name: process.env.MONGODB_DB_NAME || 'wedding_management_dev',
      primary: {
        uri:
          process.env.MONGODB_URI ||
          'mongodb://localhost:27017/wedding_management_dev',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        keepAlive: true,
        keepAliveInitialDelay: 300000,
        autoIndex: true,
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
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        keepAlive: true,
        autoIndex: true,
        retryWrites: true,
      },
    },

    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      refreshExpiresIn: '7d',
    },

    cors: {
      enabled: true,
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
      ],
      credentials: true,
    },

    swagger: {
      enabled: true,
      title: 'Wedding Management API - Development',
      description:
        'API documentation for Wedding Management System - Development Environment',
      version: '1.0',
      path: 'api/docs',
    },

    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      format: process.env.LOG_FORMAT || 'dev',
      directory: 'logs',
      maxFiles: '14d',
      maxSize: '20m',
    },

    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },

    upload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      directory: 'uploads/dev',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },

    email: {
      enabled: true,
      from: 'development@wedding-management.com',
      transport: {
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525', 10),
        auth: {
          user: process.env.SMTP_USER || 'development',
          pass: process.env.SMTP_PASS || 'development',
        },
      },
    },

    security: {
      bcryptSaltRounds: 10,
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
      },
    },
  };

  return config;
};
