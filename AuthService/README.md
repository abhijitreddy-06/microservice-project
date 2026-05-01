# Auth Service

Authentication and user account management service with JWT-based security.

## Overview

The Auth Service handles user registration, authentication, and account management. It provides JWT tokens for secure communication with other microservices and supports refresh token rotation for enhanced security.

## Features

- **User Registration**: Email-based registration with password strength validation
  - Email validation and uniqueness enforcement
  - Password strength requirements (minimum 6 characters)
  - Name validation (minimum 2 characters)
- **User Login**: JWT-based authentication with access and refresh tokens
- **Token Refresh**: Token rotation mechanism for enhanced security
- **User Logout**: Session termination support
- **Email Lookup**: Inter-service endpoint for user validation (used by DebtService)
- **Secure Password Hashing**: Bcrypt with 10 salt rounds
- **CORS Support**: Configurable frontend integration

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL 8.11+
- **ORM**: Sequelize 6.37.8
- **Authentication**: JWT 9.0.3
- **Password Hashing**: Bcrypt 6.0.0
- **Configuration**: Dotenv 17.4.2

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the service root with the following variables (see `.env.example`):

```env
PORT=5000
FRONTEND_URL=http://localhost:3005
DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=auth_db
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
INTERNAL_SERVICE_SECRET=your-internal-service-secret
```

## Running the Service

```bash
# Development mode (requires nodemon)
npm run dev

# Production mode
npm start
```

The service will start on the port specified in `PORT` environment variable (default: 5000).

## API Endpoints

### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Validation:**

- Email must be unique and valid format
- Password minimum 6 characters
- Name minimum 2 characters

### POST `/api/auth/login`

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Tokens are also set as HTTP-only cookies**

### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST `/api/auth/logout`

Logout user and invalidate refresh token.

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET `/api/auth/email-lookup/:email` (Internal)

Lookup user by email for inter-service validation. Requires `x-internal-secret` header.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

## Database Schema

**Users Table:**

- `id` (UUID, Primary Key)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `name` (VARCHAR, NOT NULL)
- `password` (VARCHAR, NOT NULL) - Bcrypt hashed
- `refreshToken` (TEXT, NULLABLE)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## Environment Variables

| Variable                  | Required | Default | Description                                       |
| ------------------------- | -------- | ------- | ------------------------------------------------- |
| `PORT`                    | No       | 5000    | Port number to run the service                    |
| `FRONTEND_URL`            | Yes      | -       | Frontend URL for CORS configuration               |
| `DB_HOST`                 | Yes      | -       | PostgreSQL host address                           |
| `DB_USERNAME`             | Yes      | -       | PostgreSQL username                               |
| `DB_PASSWORD`             | Yes      | -       | PostgreSQL password                               |
| `DB_NAME`                 | Yes      | -       | PostgreSQL database name                          |
| `ACCESS_TOKEN_SECRET`     | Yes      | -       | Secret key for signing access tokens              |
| `REFRESH_TOKEN_SECRET`    | Yes      | -       | Secret key for signing refresh tokens             |
| `ACCESS_TOKEN_EXPIRY`     | No       | 15m     | Access token expiration time (e.g., "15m", "1h")  |
| `REFRESH_TOKEN_EXPIRY`    | No       | 7d      | Refresh token expiration time (e.g., "7d", "30d") |
| `INTERNAL_SERVICE_SECRET` | Yes      | -       | Secret key for inter-service authentication       |

## Security Considerations

- **Password Hashing**: All passwords are hashed with Bcrypt (salt rounds: 10)
- **JWT Tokens**: Use HS256 algorithm with strong secrets
- **Refresh Tokens**: Stored in database for revocation capability
- **HTTP-Only Cookies**: Tokens stored as HTTP-only cookies to prevent XSS attacks
- **CORS**: Restricted to configured frontend URL
- **Rate Limiting**: Implement at API Gateway level (5 requests/15 minutes for auth endpoints)

## File Structure

```
src/
├── config/
│   └── database.js              # PostgreSQL/Sequelize configuration
├── controller/
│   └── auth.controller.js       # Route handlers
├── middleware/
│   ├── auth.middleware.js       # JWT verification middleware
│   └── error.middleware.js      # Error handling
├── model/
│   └── auth.model.js            # User model definition
├── route/
│   └── auth.route.js            # API route definitions
└── service/
    └── auth.service.js          # Business logic (registration, login, tokens)
```

## Error Handling

The service includes centralized error middleware handling:

- Invalid credentials (401 Unauthorized)
- Duplicate email (400 Bad Request)
- Invalid validation data (400 Bad Request)
- Database errors (500 Internal Server Error)
- Token-related errors (401 Unauthorized)

## Setup Instructions

1. **Ensure PostgreSQL is running**

   ```bash
   # Linux/Mac
   psql -U postgres

   # Or using Docker
   docker run --name postgres -e POSTGRES_PASSWORD=password -d postgres
   ```

2. **Create database**

   ```sql
   CREATE DATABASE auth_db;
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Generate secure secrets for JWT keys

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Start the service**
   ```bash
   npm start
   ```

## Deployment

When deploying to production:

1. Use strong, randomly generated secrets for JWT keys
2. Ensure PostgreSQL connection is secure (SSL/TLS)
3. Set `FRONTEND_URL` to your production domain
4. Implement proper environment variable management
5. Enable HTTPS for all communication
6. Set secure, HTTP-only cookie flags
7. Monitor failed login attempts

## Troubleshooting

- **Database connection errors**: Verify PostgreSQL is running and credentials are correct
- **JWT verification failures**: Ensure `ACCESS_TOKEN_SECRET` matches ApiGateway configuration
- **CORS errors**: Check `FRONTEND_URL` matches your frontend domain
- **Token expiration issues**: Verify `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` formats

## License

MIT
