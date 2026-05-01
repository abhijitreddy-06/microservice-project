# Debt Service

Inter-personal debt tracking and management service with net balance calculations.

## Overview

The Debt Service tracks loans and debts between users, manages debt settlement, and calculates net balances. It integrates with AuthService for user validation and AnalyticsService for cache invalidation when debt data changes.

## Features

- **Debt Tracking**: Record and track debts between users (who owes whom)
- **Debt Settlement**: Mark debts as settled with timestamp tracking
- **Net Balance Calculation**: Calculate net balances between any two users (who owes more overall)
- **User Validation**: Verify users exist via AuthService
- **Self-Lending Prevention**: Prevents users from creating debts with themselves
- **Amount Validation**: Enforces debt limits (max ₹1,000,000)
- **Cache Invalidation**: Automatically clears AnalyticsService cache on data changes
- **CORS Support**: Configurable for frontend integration

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL 8.11+
- **ORM**: Sequelize 6.37.8
- **HTTP Client**: Axios 1.15.2
- **Configuration**: Dotenv 17.4.2

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the service root with the following variables (see `.env.example`):

```env
PORT=3002
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=debt_db
INTERNAL_SERVICE_SECRET=your-internal-service-secret
AUTH_SERVICE_URL=http://localhost:5000
ANALYTICS_SERVICE_URL=http://localhost:3004
```

## Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will start on the port specified in `PORT` environment variable.

## API Endpoints

All endpoints require valid JWT token in Authorization header (except inter-service endpoints with `x-internal-secret`).

### POST `/api/debt/create`

Create a new debt between users.

**Request Body:**

```json
{
  "borrowerId": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 5000,
  "description": "Lunch money"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Debt created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "lenderId": "550e8400-e29b-41d4-a716-446655440000",
    "borrowerId": "550e8400-e29b-41d4-a716-446655440001",
    "amount": 5000,
    "description": "Lunch money",
    "status": "active",
    "createdAt": "2024-05-01T10:30:00Z"
  }
}
```

**Validation:**

- Borrower must be different from lender
- Amount must be between 0 and 1,000,000
- Borrower must exist in AuthService

### GET `/api/debt/all`

Get all debts for the current user (as lender or borrower).

**Query Parameters:**

- `role` (optional): "lender" or "borrower" to filter debts

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "lenderId": "550e8400-e29b-41d4-a716-446655440000",
      "borrowerId": "550e8400-e29b-41d4-a716-446655440001",
      "amount": 5000,
      "status": "active",
      "createdAt": "2024-05-01T10:30:00Z",
      "updatedAt": "2024-05-01T10:30:00Z"
    }
  ]
}
```

### PUT `/api/debt/:id/settle`

Settle a debt (mark as settled).

**Request Body:**

```json
{
  "settledBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Debt settled successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "settled",
    "settledAt": "2024-05-01T11:00:00Z"
  }
}
```

### GET `/api/debt/balance/:userId`

Get net balance between current user and another user.

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "netAmount": 3000,
    "description": "User owes you ₹3000 (you lent 5000, they lent 2000)"
  }
}
```

**Note:** Positive balance means user owes you; negative means you owe them.

### GET `/api/debt/summary` (Internal)

Get overall debt summary. Requires `x-internal-secret` header.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalBorrowed": 10000,
    "totalLent": 15000,
    "netPosition": -5000
  }
}
```

## Database Schema

**Debts Table:**

- `id` (UUID, Primary Key)
- `lender_id` (UUID, Foreign Key reference to Users)
- `borrower_id` (UUID, Foreign Key reference to Users)
- `amount` (DECIMAL(12,2), NOT NULL)
- `description` (TEXT, NULLABLE)
- `status` (ENUM: 'active', 'settled', default: 'active')
- `settled_at` (TIMESTAMP, NULLABLE)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

**NetBalance Table:**

- `id` (UUID, Primary Key)
- `user_a_id` (UUID)
- `user_b_id` (UUID)
- `net_amount` (DECIMAL, default: 0)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## Environment Variables

| Variable                  | Required | Default               | Description                                  |
| ------------------------- | -------- | --------------------- | -------------------------------------------- |
| `PORT`                    | Yes      | -                     | Port number to run the service               |
| `FRONTEND_URL`            | Yes      | -                     | Frontend URL for CORS configuration          |
| `DB_HOST`                 | Yes      | -                     | PostgreSQL host address                      |
| `DB_USERNAME`             | Yes      | -                     | PostgreSQL username                          |
| `DB_PASSWORD`             | Yes      | -                     | PostgreSQL password                          |
| `DB_NAME`                 | Yes      | -                     | PostgreSQL database name                     |
| `INTERNAL_SERVICE_SECRET` | Yes      | -                     | Secret key for inter-service authentication  |
| `AUTH_SERVICE_URL`        | Yes      | -                     | Auth Service base URL for user validation    |
| `ANALYTICS_SERVICE_URL`   | No       | http://localhost:3004 | Analytics Service URL for cache invalidation |

## Inter-Service Communication

**Calls to AuthService:**

- Email lookup to validate borrowers
- Endpoint: `GET /api/auth/email-lookup/:email`
- Authentication: `x-internal-secret` header

**Calls to AnalyticsService:**

- Cache invalidation on debt creation or settlement
- Endpoint: `POST /api/analytics/invalidate`
- Authentication: `x-internal-secret` header

## File Structure

```
src/
├── config/
│   └── database.js              # PostgreSQL/Sequelize configuration
├── controller/
│   └── debt.controller.js       # Route handlers
├── middleware/
│   ├── debt.middleware.js       # Request validation middleware
│   └── error.middleware.js      # Error handling
├── model/
│   └── debt.model.js            # Debt and NetBalance model definitions
├── route/
│   └── debt.route.js            # API route definitions
└── service/
    └── debt.service.js          # Business logic (calculations, inter-service calls)
```

## Business Logic

### Net Balance Calculation

The net balance between User A and User B is calculated as:

```
Net Balance = (Amount A lent to B) - (Amount B lent to A)
```

- **Positive**: User B owes User A
- **Negative**: User A owes User B
- **Zero**: They're even

### Debt Settlement

Settlement marks a debt as complete:

- Only lender or borrower can settle
- Settled debts cannot be reopened
- Settlement timestamp is recorded
- AnalyticsService cache is invalidated

## Error Handling

The service handles errors with appropriate HTTP status codes:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing/invalid token
- **403 Forbidden**: User not authorized for operation
- **404 Not Found**: Debt or user not found
- **500 Internal Server Error**: Server-side errors

## Setup Instructions

1. **Ensure PostgreSQL is running**

   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=password -d postgres
   ```

2. **Create database**

   ```sql
   CREATE DATABASE debt_db;
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Ensure service URLs point to running services

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

1. Ensure PostgreSQL is secure and accessible
2. Set all environment variables properly
3. Update service URLs to production instances
4. Verify `INTERNAL_SERVICE_SECRET` matches other services
5. Set `FRONTEND_URL` to production domain
6. Enable HTTPS for all communication
7. Monitor database connections and query performance

## Troubleshooting

- **Database connection errors**: Verify PostgreSQL is running and credentials are correct
- **User not found**: Ensure AuthService is running and the user exists
- **Cache invalidation fails**: Check AnalyticsService URL and `INTERNAL_SERVICE_SECRET`
- **Amount validation errors**: Verify amount is within 0-1,000,000 range
- **Self-debt error**: Ensure borrower ID is different from authenticated user ID

## Performance Notes

- Net balance calculations query the Debt table; consider indexing by user IDs
- For users with many debts, consider implementing pagination
- Cache invalidation on every debt change may impact AnalyticsService; monitor performance

## License

MIT
