# Analytics Service

Real-time financial analytics aggregation service with intelligent Redis-based caching.

## Overview

The Analytics Service provides aggregated financial analytics by fetching data from Transaction and Debt services, caching results in Redis, and invalidating cache when underlying data changes. It's designed to reduce database load and provide fast analytics queries.

## Features

- **Summary Analytics**: Overall financial summary (total income, expenses, debts)
- **Monthly Summaries**: Transaction summaries grouped by month
- **Debt Status**: Current debt overview and status
- **Intelligent Caching**: Redis-based caching with service-specific TTLs
  - Summary cache: 5 minutes
  - Monthly cache: 10 minutes
  - Debt cache: 15 minutes
- **Cache Invalidation**: Automatic cache clearing when Transaction or Debt data changes
- **CORS Support**: Configured for frontend integration

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Cache**: Redis 5.12.1
- **HTTP Client**: Axios 1.15.2
- **Configuration**: Dotenv 17.4.2

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the service root with the following variables (see `.env.example`):

```env
PORT=3004
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
TRANSACTION_SERVICE_URL=http://localhost:3001
DEBT_SERVICE_URL=http://localhost:3002
INTERNAL_SERVICE_SECRET=your-secret-key
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

All endpoints require `x-internal-secret` header for inter-service authentication.

### GET `/api/analytics/summary`

Get overall financial summary with total income, expenses, and debts.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalIncome": 50000,
    "totalExpenses": 15000,
    "netIncome": 35000,
    "totalDebtBorrowed": 5000,
    "totalDebtLent": 8000,
    "netDebt": -3000
  }
}
```

### GET `/api/analytics/monthly`

Get monthly transaction summaries.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2024-05",
      "income": 10000,
      "expenses": 3000
    }
  ]
}
```

### GET `/api/analytics/debt`

Get debt status summary.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalBorrowed": 5000,
    "totalLent": 8000,
    "netPosition": -3000
  }
}
```

## Inter-Service Communication

- **Fetches from**: TransactionService, DebtService
- **Authentication**: Uses `x-internal-secret` header for authorized requests
- **Cache Invalidation**: Listens for POST requests to `/api/analytics/invalidate` endpoints

## Environment Variables

| Variable                  | Required | Default | Description                                         |
| ------------------------- | -------- | ------- | --------------------------------------------------- |
| `PORT`                    | Yes      | -       | Port number to run the service                      |
| `FRONTEND_URL`            | Yes      | -       | Frontend URL for CORS configuration                 |
| `REDIS_URL`               | Yes      | -       | Redis connection URL (e.g., redis://localhost:6379) |
| `TRANSACTION_SERVICE_URL` | Yes      | -       | Transaction Service base URL                        |
| `DEBT_SERVICE_URL`        | Yes      | -       | Debt Service base URL                               |
| `INTERNAL_SERVICE_SECRET` | Yes      | -       | Secret key for inter-service authentication         |

## File Structure

```
src/
├── config/
│   └── redis.js              # Redis connection configuration
├── controller/
│   └── analytics.controller.js  # Route handlers
├── middleware/
│   ├── analytics.middleware.js  # Internal service auth middleware
│   └── error.middleware.js      # Error handling
├── route/
│   └── analytics.route.js     # API route definitions
└── service/
    └── analytics.service.js   # Business logic and caching
```

## Error Handling

The service includes centralized error middleware that handles:

- Invalid requests (400 Bad Request)
- Unauthorized access (401 Unauthorized)
- Service unavailability (503 Service Unavailable)
- Internal server errors (500 Internal Server Error)

## Performance Notes

- Redis caching significantly reduces load on Transaction and Debt services
- Cache TTLs are tuned for typical financial dashboard use cases
- Consider adjusting TTLs based on your data freshness requirements
- Monitor Redis memory usage in production

## Deployment

When deploying to production:

1. Ensure Redis server is accessible and running
2. Set all environment variables (especially secrets)
3. Configure `FRONTEND_URL` for your production domain
4. Update service URLs to point to production instances
5. Monitor Redis connections and memory usage
6. Implement log aggregation for debugging

## Troubleshooting

- **Redis connection errors**: Verify `REDIS_URL` is correct and Redis server is running
- **Service unavailable errors**: Check if Transaction and Debt services are running
- **Authentication failures**: Verify `INTERNAL_SERVICE_SECRET` matches other services
- **Stale data**: Check cache invalidation is being triggered by other services

## License

MIT
