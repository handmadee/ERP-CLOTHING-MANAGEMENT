# Wedding Management Backend

A professional NestJS backend application for wedding management with TypeScript, MongoDB, and modern best practices.

## Features

- 🔐 Secure Authentication & Authorization
- 📝 Comprehensive API Documentation with Swagger
- 🗄️ MongoDB Integration with Mongoose
- 🔒 Security Features (Helmet, CORS, Rate Limiting)
- 📊 Request Validation & Transformation
- 🎯 Error Handling & Logging
- 🚀 Production-Ready Configuration
- 🧪 Testing Setup (Unit & E2E)
- 🔄 Base Classes for CRUD Operations
- 📦 Modular Architecture

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## Configuration

Update the `.env` file with your configuration:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
MONGODB_DB_NAME=wedding_management
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
http://localhost:3000/api/docs

## Project Structure

```
src/
├── common/              # Shared code, interfaces, and utilities
│   ├── constants/      # Constants and enums
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Authentication guards
│   ├── interceptors/   # Response transformers
│   └── interfaces/     # TypeScript interfaces
├── config/             # Configuration files
├── modules/            # Feature modules
├── app.module.ts       # Main application module
└── main.ts            # Application entry point
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Security Features

- Helmet for secure HTTP headers
- CORS protection
- Rate limiting
- JWT authentication
- Request validation
- MongoDB injection protection
- Security best practices enforcement

## Error Handling

The application includes a global exception filter that standardizes error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "statusCode": 400,
    "error": "Bad Request",
    "details": {}
  },
  "metadata": {
    "timestamp": "2024-03-14T12:00:00Z",
    "path": "/api/endpoint"
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
