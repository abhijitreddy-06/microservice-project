# Personal Finance Microservices Platform

A modern, scalable microservices-based personal finance management system built with Node.js, Express, and PostgreSQL. Track transactions, manage debt, and analyze financial health in real-time.

## 🏗️ Architecture Overview

This project follows a microservices architecture with the following services:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                   :3005 (Not Included)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────▼───────┐
         │  API Gateway  │
         │    :3000      │
         └───┬──┬──┬──┬──┘
             │  │  │  │
    ┌────────┘  │  │  └─────────┐
    │           │  │            │
    ▼           ▼  ▼            ▼
┌─────────┐ ┌───────┐ ┌──────┐ ┌──────────┐
│ Auth    │ │Trans- │ │ Debt │ │Analytics │
│ Service │ │ action│ │ Svc  │ │ Service  │
│ :3001   │ │ Svc   │ │:3003 │ │  :3004   │
│         │ │:3002  │ │      │ │          │
└────┬────┘ └───┬───┘ └──┬───┘ └────┬─────┘
     │          │        │          │
     │    ┌─────┴────────┴──────────┘
     │    │
  ┌──▼────▼──────────┐    ┌──────────┐
  │   PostgreSQL     │    │  Redis   │
  │   (Auth, Txn,    │    │ (Cache)  │
  │   Debt, Analytics)   │          │
  └──────────────────┘    └──────────┘
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| **API Gateway** | 3000 | Request routing, JWT verification, rate limiting |
| **Auth Service** | 3001 | User registration, login, token management |
| **Transaction Service** | 3002 | Income/expense tracking with categories |
| **Debt Service** | 3003 | Debt tracking and settlement management |
| **Analytics Service** | 3004 | Financial insights with Redis caching |

### Data Stores

- **PostgreSQL**: Persistent data (users, transactions, debts)
- **Redis**: Cache layer for Analytics Service

## 🚀 Quick Start with Docker

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MicroService
   ```

2. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

   The command will:
   - Build Docker images for all 5 services
   - Create and start PostgreSQL and Redis containers
   - Wire services together with internal networking
   - Expose ports 3000-3004 on your local machine

3. **Verify all services are running**
   ```bash
   docker-compose ps
   ```

   Expected output:
   ```
   NAME                      STATUS
   api_gateway               Up (healthy)
   auth_service              Up (healthy)
   transaction_service       Up (healthy)
   debt_service              Up (healthy)
   analytics_service         Up (healthy)
   microservice_postgres     Up (healthy)
   microservice_redis        Up (healthy)
   ```

4. **Test the API Gateway**
   ```bash
   curl http://localhost:3000/api/auth/register \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","name":"Test User","password":"TestPass123"}'
   ```

### Stopping Services

```bash
# Stop all containers (keeps volumes)
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Stop specific service
docker-compose stop auth-service
```

## 📁 Project Structure

```
MicroService/
├── docker-compose.yml           # Orchestration config
├── README.md                    # This file
│
├── ApiGateway/
│   ├── Dockerfile              # Built with Node 20
│   ├── package.json
│   ├── server.js
│   ├── .env                    # Service configuration
│   └── src/
│       ├── middleware/         # JWT, CORS, rate limiting
│       ├── routes/             # Proxy definitions
│       └── utils/
│
├── AuthService/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── .env
│   └── src/
│       ├── config/            # DB connection
│       ├── controller/        # Auth handlers
│       ├── model/             # User schema
│       ├── service/           # Business logic
│       └── middleware/
│
├── TransactionService/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── .env
│   └── src/
│       ├── config/
│       ├── controller/
│       ├── model/
│       ├── service/
│       └── middleware/
│
├── DebtService/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── .env
│   └── src/
│       ├── config/
│       ├── controller/
│       ├── model/
│       ├── service/
│       └── middleware/
│
└── AnalyticsService/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    ├── .env
    └── src/
        ├── config/           # Redis connection
        ├── controller/
        ├── service/         # Caching logic
        └── middleware/
```

## 🔧 Configuration

### Environment Variables

Each service has a `.env` file with the following structure:

**API Gateway (.env)**
```env
PORT=3000
FRONTEND_URL=http://localhost:3005
AUTH_SERVICE_URL=http://auth-service:3001
TRANSACTION_SERVICE_URL=http://transaction-service:3002
DEBT_SERVICE_URL=http://debt-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:3004
ACCESS_TOKEN_SECRET=your-secret-key
INTERNAL_SERVICE_SECRET=your-internal-secret
```

**Database Services (.env)**
```env
PORT=3001|3002|3003
DB_HOST=postgres
DB_USERNAME=postgres
DB_PASSWORD=Abhi.data
DB_NAME=Auth_db|Transaction_db|Debt_db
INTERNAL_SERVICE_SECRET=your-internal-secret
```

**Analytics Service (.env)**
```env
PORT=3004
REDIS_URL=redis://redis:6379
TRANSACTION_SERVICE_URL=http://transaction-service:3002
DEBT_SERVICE_URL=http://debt-service:3003
INTERNAL_SERVICE_SECRET=your-internal-secret
```

**Note**: When running with Docker Compose, service URLs use container names (e.g., `http://auth-service:3001`) instead of `localhost`.

## 📚 API Documentation

### Authentication Endpoints

Base URL: `http://localhost:3000/api/auth`

**POST `/register`** - User registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "secure123"
  }'
```

**POST `/login`** - User login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

**POST `/refresh`** - Refresh access token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

**POST `/logout`** - User logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer your-access-token"
```

### Transaction Endpoints

Base URL: `http://localhost:3000/api/transactions`

**POST `/create`** - Create transaction
```bash
curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "type": "income",
    "amount": 50000,
    "category": "Salary",
    "description": "Monthly salary",
    "transactionDate": "2024-05-01"
  }'
```

**GET `/all`** - Get all transactions
```bash
curl http://localhost:3000/api/transactions/all \
  -H "Authorization: Bearer your-access-token"
```

**GET `/summary`** - Get transaction summary
```bash
curl http://localhost:3000/api/transactions/summary \
  -H "Authorization: Bearer your-access-token"
```

### Debt Endpoints

Base URL: `http://localhost:3000/api/debt`

**POST `/create`** - Create debt entry
```bash
curl -X POST http://localhost:3000/api/debt/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "borrowerId": "user-id",
    "amount": 5000,
    "description": "Lunch money"
  }'
```

**GET `/all`** - Get all debts
```bash
curl http://localhost:3000/api/debt/all \
  -H "Authorization: Bearer your-access-token"
```

**PUT `/:id/settle`** - Settle a debt
```bash
curl -X PUT http://localhost:3000/api/debt/12345/settle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{"settledBy": "user-id"}'
```

### Analytics Endpoints

Base URL: `http://localhost:3000/api/analytics`

**GET `/summary`** - Get overall financial summary
```bash
curl http://localhost:3000/api/analytics/summary \
  -H "Authorization: Bearer your-access-token"
```

**GET `/monthly`** - Get monthly summaries
```bash
curl http://localhost:3000/api/analytics/monthly \
  -H "Authorization: Bearer your-access-token"
```

**GET `/debt`** - Get debt status
```bash
curl http://localhost:3000/api/analytics/debt \
  -H "Authorization: Bearer your-access-token"
```

## 🐳 Docker Build Details

### Dockerfile Specifications

All services use the same optimized Dockerfile pattern:

```dockerfile
FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE [SERVICE_PORT]

CMD ["node", "server.js"]
```

**Base Image**: `node:20-bookworm-slim`
- Small footprint (~150MB)
- Production-optimized
- Includes security patches

**Build Optimization**:
- Installs only production dependencies (`--omit=dev`)
- Layers are cached for faster rebuilds
- Final image size: ~200-250MB per service

### Service Port Mapping

| Service | Internal Port | Container Exposed | Host Mapped |
|---------|---------------|-------------------|-------------|
| API Gateway | 3000 | 3000 | localhost:3000 |
| Auth Service | 3001 | 3001 | localhost:3001 |
| Transaction Service | 3002 | 3002 | localhost:3002 |
| Debt Service | 3003 | 3003 | localhost:3003 |
| Analytics Service | 3004 | 3004 | localhost:3004 |
| PostgreSQL | 5432 | 5432 | localhost:5432 |
| Redis | 6379 | 6379 | localhost:6379 |

## 🧑‍💻 Development Workflow

### Local Development (without Docker)

1. **Install Node.js dependencies**
   ```bash
   cd AuthService && npm install
   cd ../TransactionService && npm install
   cd ../DebtService && npm install
   cd ../AnalyticsService && npm install
   cd ../ApiGateway && npm install
   ```

2. **Start PostgreSQL and Redis locally**
   ```bash
   # Using brew (macOS)
   brew services start postgresql
   brew services start redis

   # Or Docker (single containers)
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=Abhi.data postgres:16-alpine
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Create databases**
   ```bash
   psql -U postgres -c "CREATE DATABASE Auth_db;"
   psql -U postgres -c "CREATE DATABASE Transaction_db;"
   psql -U postgres -c "CREATE DATABASE Debt_db;"
   psql -U postgres -c "CREATE DATABASE Analytics_db;"
   ```

4. **Start each service** (in separate terminals)
   ```bash
   cd AuthService && npm start
   cd TransactionService && npm start
   cd DebtService && npm start
   cd AnalyticsService && npm start
   cd ApiGateway && npm start
   ```

### Docker Development Workflow

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f auth-service

# Rebuild specific service after code changes
docker-compose up -d --build auth-service

# Execute commands inside container
docker-compose exec auth-service npm test

# Access PostgreSQL in container
docker-compose exec postgres psql -U postgres -d Auth_db
```

## 🔍 Health Checks

Each service includes health checks that Docker uses to verify readiness:

```bash
# Check service health
docker-compose ps

# Detailed health check status
docker inspect microservice_postgres --format='{{.State.Health.Status}}'
```

PostgreSQL is ready when:
- Port 5432 responds to `pg_isready`
- Connection pool initialized

Redis is ready when:
- `PING` command returns `PONG`

Services depend on these being healthy before starting.

## 📊 Database Schema

### Auth Service (Auth_db)
- **Users Table**: id, email, name, password_hash, refreshToken

### Transaction Service (Transaction_db)
- **Transactions Table**: id, userId, type, amount, category, description, transactionDate

### Debt Service (Debt_db)
- **Debts Table**: id, lenderId, borrowerId, amount, description, status, settledAt
- **NetBalance Table**: id, userAId, userBId, netAmount

### Analytics Service (Analytics_db)
- Primarily uses Redis cache; PostgreSQL optional for persistence

## 🚨 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs auth-service

# Common issues:
# 1. Port already in use
lsof -i :3000

# 2. Database connection failed
docker-compose logs postgres

# 3. Service dependency not ready
docker-compose up --scale auth-service=0  # Stop service
docker-compose up -d                      # Restart all
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose exec postgres psql -U postgres -c "\l"

# Check network connectivity
docker-compose exec auth-service ping postgres

# Verify credentials
docker-compose exec postgres psql -U postgres -d Auth_db -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Verify Redis is running
docker-compose exec redis redis-cli ping

# Check data
docker-compose exec redis redis-cli KEYS "*"

# Clear cache
docker-compose exec redis redis-cli FLUSHALL
```

### Service Communication Issues

```bash
# Test internal service URLs
docker-compose exec auth-service curl http://transaction-service:3002/health

# Verify DNS resolution
docker-compose exec auth-service nslookup transaction-service
```

## 🔐 Security Notes

⚠️ **Important**: The default credentials in this setup are for **development only**.

### Production Recommendations

1. **Change all secrets** in `.env` files
2. **Use strong passwords** for database
3. **Enable authentication** on Redis
4. **Use SSL/TLS** for inter-service communication
5. **Implement API keys** for service-to-service auth
6. **Set resource limits** in docker-compose (CPU, memory)
7. **Use environment-specific configs**
8. **Rotate JWT secrets** regularly

### Environment Variables to Override

```bash
# Create .env.production
ACCESS_TOKEN_SECRET=<generate-strong-secret>
REFRESH_TOKEN_SECRET=<generate-strong-secret>
INTERNAL_SERVICE_SECRET=<generate-strong-secret>
DB_PASSWORD=<generate-strong-password>
```

## 📦 Deployment

### To Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag images
docker tag api_gateway your-username/api-gateway:latest
docker tag auth_service your-username/auth-service:latest

# Push to registry
docker push your-username/api-gateway:latest
docker push your-username/auth-service:latest
```

### To Kubernetes (Minikube)

```bash
# Create namespace
kubectl create namespace microservices

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml -n microservices

# Deploy services
kubectl apply -f k8s/api-gateway.yaml -n microservices
kubectl apply -f k8s/auth-service.yaml -n microservices
```

## 📈 Monitoring & Logging

### View Service Logs

```bash
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Follow specific service
docker-compose logs -f --tail=50 auth-service

# Timestamp included
docker-compose logs -f --timestamps
```

### Monitor Resource Usage

```bash
docker stats
```

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch
3. Make changes to a service
4. Rebuild: `docker-compose up --build`
5. Test the changes
6. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review individual service READMEs in each service directory
- Review logs: `docker-compose logs -f`

---

**Last Updated**: May 1, 2026
**Docker Compose Version**: 3.9
**Node Version**: 20-bookworm-slim
