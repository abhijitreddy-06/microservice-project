# API Gateway

Central API gateway service for routing, authentication, and rate limiting across all microservices.

## Overview

The API Gateway serves as the single entry point for all client requests. It handles routing to appropriate services, JWT token verification, rate limiting, CORS configuration, and inter-service authentication. It provides a unified API surface for the frontend application.

## Features

- **Request Routing**: Routes to Auth, Transaction, Debt, and Analytics services
- **JWT Verification**: Token validation for protected endpoints
- **Rate Limiting**: Service-level rate limiting
  - Auth endpoints: 5 requests/15 minutes
  - API endpoints: 100 requests/15 minutes
- **CORS Support**: Configurable for frontend integration
- **Cookie Management**: Automatic cookie forwarding
- **Dual Proxy Methods**: HTTP proxy middleware and fetch-based forwarding
- **Internal Service Authentication**: Uses `x-internal-secret` header for inter-service calls
- **Error Handling**: Centralized error middleware

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.2.1
- **Rate Limiting**: express-rate-limit 8.4.1
- **Proxy**: http-proxy-middleware 3.0.5
- **HTTP Client**: Axios 1.15.2 (for fetch-based forwarding)
- **Configuration**: Dotenv 17.4.2

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the service root with the following variables (see `.env.example`):

```env
PORT=3000
FRONTEND_URL=http://localhost:3005
AUTH_SERVICE_URL=http://localhost:5000
TRANSACTION_SERVICE_URL=http://localhost:3001
DEBT_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3004
ACCESS_TOKEN_SECRET=your-access-token-secret
INTERNAL_SERVICE_SECRET=your-internal-service-secret
```

## Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will start on the port specified in `PORT` environment variable (default: 3000).

## API Routes

The gateway routes all requests to downstream services. All requests must include valid JWT tokens (except auth endpoints).

### Authentication Routes

**Base Path**: `/api/auth/*`

- Routes to: AuthService
- Rate Limit: 5 requests/15 minutes
- JWT Required: No (except token refresh)

Routes:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Transaction Routes

**Base Path**: `/api/transactions/*`

- Routes to: TransactionService
- Rate Limit: 100 requests/15 minutes
- JWT Required: Yes

Routes:

- `POST /api/transactions/create` - Create transaction
- `GET /api/transactions/all` - Get all transactions
- `GET /api/transactions/income` - Get income transactions
- `GET /api/transactions/expenses` - Get expense transactions
- `GET /api/transactions/summary` - Get transaction summary
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Debt Routes

**Base Path**: `/api/debt/*`

- Routes to: DebtService
- Rate Limit: 100 requests/15 minutes
- JWT Required: Yes

Routes:

- `POST /api/debt/create` - Create debt
- `GET /api/debt/all` - Get all debts
- `PUT /api/debt/:id/settle` - Settle debt
- `GET /api/debt/balance/:userId` - Get net balance

### Analytics Routes

**Base Path**: `/api/analytics/*`

- Routes to: AnalyticsService
- Rate Limit: 100 requests/15 minutes
- JWT Required: Yes

Routes:

- `GET /api/analytics/summary` - Overall financial summary
- `GET /api/analytics/monthly` - Monthly summaries
- `GET /api/analytics/debt` - Debt status

## Environment Variables

| Variable                  | Required | Default | Description                                                           |
| ------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `PORT`                    | No       | 3000    | Port number to run the gateway                                        |
| `FRONTEND_URL`            | Yes      | -       | Frontend URL for CORS configuration                                   |
| `AUTH_SERVICE_URL`        | Yes      | -       | Auth Service base URL                                                 |
| `TRANSACTION_SERVICE_URL` | Yes      | -       | Transaction Service base URL                                          |
| `DEBT_SERVICE_URL`        | Yes      | -       | Debt Service base URL                                                 |
| `ANALYTICS_SERVICE_URL`   | Yes      | -       | Analytics Service base URL                                            |
| `ACCESS_TOKEN_SECRET`     | Yes      | -       | Secret key for verifying JWT tokens (must match AuthService)          |
| `INTERNAL_SERVICE_SECRET` | Yes      | -       | Secret key for inter-service authentication (must match all services) |

## File Structure

```
src/
├── config/
│   └── urls.js                  # Service URL configuration
├── middleware/
│   ├── auth.middleware.js       # JWT verification middleware
│   ├── error.middleware.js      # Error handling
│   └── rateLimit.middleware.js  # Rate limiting setup
├── routes/
│   └── gateway.routes.js        # Route definitions and proxy setup
└── utils/
    └── createError.js           # Error creation utility
```

## Rate Limiting Strategy

**Auth Endpoints** (5 requests per 15 minutes):

- Protects authentication endpoints from brute force attacks
- Per IP address tracking
- Returns 429 Too Many Requests on limit exceeded

**API Endpoints** (100 requests per 15 minutes):

- Protects downstream services from overload
- Per user (extracted from JWT token)
- Returns 429 Too Many Requests on limit exceeded

## Request Flow

```
1. Client sends request to Gateway
   ↓
2. CORS validation & parsing
   ↓
3. Rate limit check
   ↓
4. JWT token verification (if protected route)
   ↓
5. Add x-internal-secret header
   ↓
6. Forward to appropriate service
   ↓
7. Return response to client
```

## CORS Configuration

The gateway allows requests only from configured `FRONTEND_URL`:

```javascript
corsOptions: {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

## Error Handling

Error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

Common errors:

- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Missing or invalid token
- **429 Too Many Requests**: Rate limit exceeded
- **503 Service Unavailable**: Downstream service is down

## Security Considerations

- **Token Verification**: All protected routes verify JWT signature before forwarding
- **Internal Secret**: Passed to downstream services to allow them to verify inter-service calls
- **CORS Restriction**: Only allowed frontend can access the gateway
- **Cookie Forwarding**: Cookies are forwarded with `credentials: include`
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Header Propagation**: Authorization header forwarded to services

## Setup Instructions

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update all service URLs to your environment
   - Ensure secrets match with other services

3. **Ensure downstream services are running**
   - AuthService on `AUTH_SERVICE_URL`
   - TransactionService on `TRANSACTION_SERVICE_URL`
   - DebtService on `DEBT_SERVICE_URL`
   - AnalyticsService on `ANALYTICS_SERVICE_URL`

4. **Start the gateway**
   ```bash
   npm start
   ```

## Deployment

When deploying to production:

1. Set `PORT` to your production port (typically 80 or behind reverse proxy)
2. Set `FRONTEND_URL` to your production frontend domain
3. Update all service URLs to production endpoints
4. Use strong, randomly generated secrets for tokens
5. Enable HTTPS for all communication
6. Consider implementing:
   - Request logging/monitoring
   - Rate limit storage in Redis (for distributed systems)
   - API key management
   - Request tracing/correlation IDs

## Troubleshooting

- **CORS errors**: Verify `FRONTEND_URL` matches your frontend domain exactly
- **404 errors**: Check that downstream services are running on configured URLs
- **401 Unauthorized**: Verify `ACCESS_TOKEN_SECRET` matches AuthService
- **429 Too Many Requests**: Rate limit exceeded, wait before retrying
- **Service unavailable**: Check downstream service is running and accessible

## Monitoring

Monitor the gateway for:

- High rate limit hits (may indicate attack or misconfiguration)
- Request latency to downstream services
- Failed service connections
- Token verification failures
- CORS rejection rates

## License

MIT
