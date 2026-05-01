# Transaction Service

Personal financial transaction tracking service with income/expense categorization.

## Overview

The Transaction Service manages personal financial transactions (income and expenses) with category support, amount tracking, and transaction history. It integrates with AnalyticsService for cache invalidation when transaction data changes, enabling real-time analytics updates.

## Features

- **Transaction Creation**: Record income and expense transactions with categories
- **Transaction History**: View all transactions with dates and details
- **Income Filtering**: View only income transactions
- **Expense Filtering**: View only expense transactions
- **Transaction Summaries**: Get aggregated transaction data
- **Transaction Updates**: Modify existing transactions
- **Transaction Deletion**: Remove transactions
- **Category Support**: Organize transactions by category
- **Amount Validation**: Enforces amount limits (₹0-1,000,000)
- **Cache Invalidation**: Automatically clears AnalyticsService cache on changes
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
PORT=3001
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=transaction_db
INTERNAL_SERVICE_SECRET=your-internal-service-secret
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

### POST `/api/transactions/create`

Create a new transaction.

**Request Body:**

```json
{
  "type": "income",
  "amount": 50000,
  "category": "Salary",
  "description": "Monthly salary",
  "transactionDate": "2024-05-01"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "type": "income",
    "amount": 50000,
    "category": "Salary",
    "description": "Monthly salary",
    "transactionDate": "2024-05-01",
    "createdAt": "2024-05-01T10:30:00Z"
  }
}
```

**Validation:**

- Type must be "income" or "expense"
- Amount must be between 0 and 1,000,000
- Category is required and must be a string
- Transaction date must be valid ISO format

### GET `/api/transactions/all`

Get all transactions for the current user.

**Query Parameters:**

- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (default: transactionDate)
- `order` (optional): "ASC" or "DESC" (default: DESC)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "income",
      "amount": 50000,
      "category": "Salary",
      "description": "Monthly salary",
      "transactionDate": "2024-05-01",
      "createdAt": "2024-05-01T10:30:00Z"
    }
  ]
}
```

### GET `/api/transactions/income`

Get only income transactions.

**Query Parameters:** Same as `/all`

**Response:** Array of income transactions

### GET `/api/transactions/expenses`

Get only expense transactions.

**Query Parameters:** Same as `/all`

**Response:** Array of expense transactions

### GET `/api/transactions/summary`

Get transaction summary with totals.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalIncome": 50000,
    "totalExpenses": 15000,
    "netIncome": 35000,
    "transactionCount": 20,
    "incomeCount": 12,
    "expenseCount": 8
  }
}
```

### PUT `/api/transactions/:id`

Update an existing transaction.

**Request Body:**

```json
{
  "type": "income",
  "amount": 55000,
  "category": "Salary",
  "description": "Monthly salary - updated",
  "transactionDate": "2024-05-01"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "income",
    "amount": 55000,
    "category": "Salary",
    "description": "Monthly salary - updated",
    "transactionDate": "2024-05-01",
    "updatedAt": "2024-05-01T11:00:00Z"
  }
}
```

### DELETE `/api/transactions/:id`

Delete a transaction.

**Response:**

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

### GET `/api/transactions/all` (Internal)

Get all transactions for a specific user. Requires `x-internal-secret` header.

**Query Parameters:**

- `userId`: User ID to fetch transactions for

**Response:** Array of transactions for the user

## Database Schema

**Transactions Table:**

- `id` (UUID, Primary Key)
- `userId` (UUID, NOT NULL) - References user from AuthService
- `type` (ENUM: 'income', 'expense', NOT NULL)
- `amount` (DECIMAL(12,2), NOT NULL, positive values only)
- `category` (VARCHAR, NOT NULL)
- `description` (TEXT, NULLABLE)
- `transactionDate` (DATE, NOT NULL)
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
| `ANALYTICS_SERVICE_URL`   | No       | http://localhost:3004 | Analytics Service URL for cache invalidation |

## Inter-Service Communication

**Calls to AnalyticsService:**

- Cache invalidation on transaction creation, update, or deletion
- Endpoint: `POST /api/analytics/invalidate`
- Authentication: `x-internal-secret` header
- Called whenever transaction data changes to keep analytics fresh

## File Structure

```
src/
├── config/
│   └── database.js              # PostgreSQL/Sequelize configuration
├── controller/
│   └── transaction.controller.js # Route handlers
├── middleware/
│   ├── transaction.middleware.js # Request validation middleware
│   └── error.middleware.js       # Error handling
├── model/
│   └── transaction.model.js      # Transaction model definition
├── route/
│   └── transaction.route.js      # API route definitions
└── service/
    └── transaction.service.js    # Business logic (queries, inter-service calls)
```

## Business Logic

### Transaction Types

- **Income**: Money received (salary, bonus, gifts, etc.)
  - Amount: Positive values only
  - Contributes to total income
- **Expense**: Money spent (food, utilities, entertainment, etc.)
  - Amount: Positive values (stored as-is, negation applied in calculations)
  - Contributes to total expenses

### Categories

Common categories:

- **Income**: Salary, Bonus, Gift, Freelance, Investment Returns, Other
- **Expenses**: Food, Transport, Utilities, Entertainment, Shopping, Education, Medical, Other

## Error Handling

The service handles errors with appropriate HTTP status codes:

- **400 Bad Request**: Invalid input data, invalid amount or type
- **401 Unauthorized**: Missing/invalid token
- **403 Forbidden**: User not authorized to access transaction
- **404 Not Found**: Transaction not found
- **500 Internal Server Error**: Server-side errors

## Setup Instructions

1. **Ensure PostgreSQL is running**

   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=password -d postgres
   ```

2. **Create database**

   ```sql
   CREATE DATABASE transaction_db;
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Set AnalyticsService URL

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
3. Update AnalyticsService URL to production instance
4. Verify `INTERNAL_SERVICE_SECRET` matches other services
5. Set `FRONTEND_URL` to production domain
6. Enable HTTPS for all communication
7. Consider implementing:
   - Pagination for large transaction histories
   - Full-text search on categories and descriptions
   - Transaction date range filtering
   - Backup and recovery strategies

## Performance Optimization

- **Indexing**: Create indexes on `userId`, `type`, `transactionDate` for faster queries
- **Pagination**: Use limit/offset for large transaction lists
- **Aggregation**: Summary endpoint uses efficient SQL aggregation
- **Caching**: Analytics cache invalidation prevents stale data

## Troubleshooting

- **Database connection errors**: Verify PostgreSQL is running and credentials are correct
- **Cache invalidation fails**: Check AnalyticsService URL and `INTERNAL_SERVICE_SECRET`
- **Amount validation errors**: Verify amount is within 0-1,000,000 range
- **Transaction not found**: Ensure you're querying your own transactions (userId matches token)
- **Type enum errors**: Type must be exactly "income" or "expense" (lowercase)

## Common Categories

**Income:**

- Salary
- Bonus
- Freelance
- Investment Returns
- Gift
- Other Income

**Expenses:**

- Food & Dining
- Transportation
- Utilities & Bills
- Entertainment
- Shopping
- Education
- Medical & Health
- Other Expenses

## License

MIT
