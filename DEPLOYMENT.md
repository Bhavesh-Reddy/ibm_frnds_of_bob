# 🚀 Obfusi-Bob Deployment Guide

Complete guide for deploying Obfusi-Bob to production environments.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Platforms](#cloud-platforms)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security Checklist](#security-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v20.x or higher
- **Docker**: v24.x or higher
- **Docker Compose**: v2.x or higher
- **PostgreSQL**: v15.x (if not using Docker)
- **Redis**: v7.x (if not using Docker)

### Optional (for actual obfuscation)
- **LLVM**: v15.x or higher
- **Clang**: v15.x or higher

---

## Local Development

### 1. Clone and Install

```bash
# Navigate to project
cd obfusi-bob

# Install MCP server dependencies
cd mcp-server
npm install

# Build TypeScript
npm run build

# Return to root
cd ..
```

### 2. Start Development Server

```bash
# Start the API server
node api-server.js

# Access the application
# Login: http://localhost:3002/login.html
# Dashboard: http://localhost:3002/dashboard.html
```

### 3. Run Tests

```bash
# Ensure server is running, then:
node tests/api.test.js
```

---

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f obfusi-bob

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Individual Container

```bash
# Build image
docker build -t obfusi-bob:latest .

# Run container
docker run -d \
  --name obfusi-bob \
  -p 3002:3002 \
  -e NODE_ENV=production \
  obfusi-bob:latest

# View logs
docker logs -f obfusi-bob

# Stop container
docker stop obfusi-bob
docker rm obfusi-bob
```

### Docker Compose Services

The `docker-compose.yml` includes:

- **obfusi-bob**: Main application
- **redis**: Session storage
- **postgres**: Data persistence
- **nginx**: Reverse proxy (optional)
- **prometheus**: Metrics collection (optional)
- **grafana**: Metrics visualization (optional)

---

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace obfusi-bob
```

### 2. Create Secrets

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=obfusibob \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  -n obfusi-bob

# Redis password
kubectl create secret generic redis-credentials \
  --from-literal=password=YOUR_REDIS_PASSWORD \
  -n obfusi-bob

# Session secret
kubectl create secret generic session-secret \
  --from-literal=secret=YOUR_SESSION_SECRET \
  -n obfusi-bob
```

### 3. Deploy PostgreSQL

```yaml
# postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: obfusi-bob
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: obfusibob
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: obfusi-bob
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### 4. Deploy Redis

```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: obfusi-bob
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - --requirepass
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: password
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: obfusi-bob
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### 5. Deploy Application

```yaml
# app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: obfusi-bob
  namespace: obfusi-bob
spec:
  replicas: 3
  selector:
    matchLabels:
      app: obfusi-bob
  template:
    metadata:
      labels:
        app: obfusi-bob
    spec:
      containers:
      - name: obfusi-bob
        image: obfusi-bob:latest
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3002"
        - name: POSTGRES_URL
          value: postgresql://$(DB_USER):$(DB_PASSWORD)@postgres:5432/obfusibob
        - name: REDIS_URL
          value: redis://:$(REDIS_PASSWORD)@redis:6379
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: password
        ports:
        - containerPort: 3002
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: obfusi-bob
  namespace: obfusi-bob
spec:
  type: LoadBalancer
  selector:
    app: obfusi-bob
  ports:
  - port: 80
    targetPort: 3002
```

### 6. Apply Configurations

```bash
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f app-deployment.yaml

# Check status
kubectl get pods -n obfusi-bob
kubectl get services -n obfusi-bob
```

---

## Cloud Platforms

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Push image to ECR**:
```bash
aws ecr create-repository --repository-name obfusi-bob
docker tag obfusi-bob:latest <account-id>.dkr.ecr.<region>.amazonaws.com/obfusi-bob:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/obfusi-bob:latest
```

2. **Create RDS PostgreSQL instance**
3. **Create ElastiCache Redis cluster**
4. **Create ECS task definition**
5. **Create ECS service**
6. **Configure Application Load Balancer**

#### Using EKS (Elastic Kubernetes Service)

Follow Kubernetes deployment steps above.

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/obfusi-bob

# Deploy to Cloud Run
gcloud run deploy obfusi-bob \
  --image gcr.io/PROJECT_ID/obfusi-bob \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Microsoft Azure

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name obfusi-bob-rg --location eastus

# Create container
az container create \
  --resource-group obfusi-bob-rg \
  --name obfusi-bob \
  --image obfusi-bob:latest \
  --dns-name-label obfusi-bob \
  --ports 3002
```

---

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Database
POSTGRES_URL=postgresql://user:password@host:5432/dbname
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=obfusibob
POSTGRES_USER=obfusibob
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Security
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# watsonx.ai (Optional)
WATSONX_API_KEY=your-api-key
WATSONX_PROJECT_ID=your-project-id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

### Optional Variables

```bash
# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Logging
LOG_FORMAT=json
LOG_FILE=/app/logs/app.log

# Features
ENABLE_ANALYTICS=true
ENABLE_EXPORT=true
```

---

## Database Setup

### Manual PostgreSQL Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE obfusibob;
CREATE USER obfusibob WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE obfusibob TO obfusibob;

# Exit and run initialization script
psql -U obfusibob -d obfusibob -f database/init.sql
```

### Database Migrations

```bash
# Future: Use migration tool like Flyway or Liquibase
# For now, run init.sql manually
```

---

## Monitoring & Logging

### Prometheus Metrics

Access Prometheus at: `http://localhost:9090`

Key metrics:
- `http_requests_total`
- `http_request_duration_seconds`
- `active_sessions`
- `api_errors_total`

### Grafana Dashboards

Access Grafana at: `http://localhost:3000`

Default credentials:
- Username: `admin`
- Password: `admin`

### Application Logs

```bash
# Docker logs
docker-compose logs -f obfusi-bob

# Kubernetes logs
kubectl logs -f deployment/obfusi-bob -n obfusi-bob

# Local logs
tail -f logs/app.log
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate secure session secrets
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Review and update security headers
- [ ] Enable audit logging
- [ ] Set up backup strategy
- [ ] Configure monitoring alerts

### Post-Deployment

- [ ] Test authentication flows
- [ ] Verify rate limiting works
- [ ] Check HTTPS is enforced
- [ ] Test error handling
- [ ] Verify logs are being collected
- [ ] Test backup and restore
- [ ] Run security scan
- [ ] Perform load testing
- [ ] Set up monitoring dashboards
- [ ] Document incident response plan

---

## Troubleshooting

### Common Issues

#### 1. Container won't start

```bash
# Check logs
docker logs obfusi-bob

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

#### 2. Database connection errors

```bash
# Test connection
psql -h localhost -U obfusibob -d obfusibob

# Check environment variables
echo $POSTGRES_URL

# Verify network connectivity
docker-compose exec obfusi-bob ping postgres
```

#### 3. Redis connection errors

```bash
# Test Redis
redis-cli -h localhost -p 6379 ping

# Check password
redis-cli -h localhost -p 6379 -a your_password ping
```

#### 4. High memory usage

```bash
# Check container stats
docker stats obfusi-bob

# Increase memory limit in docker-compose.yml
services:
  obfusi-bob:
    mem_limit: 2g
```

#### 5. Slow response times

```bash
# Check database queries
# Enable query logging in PostgreSQL

# Check Redis performance
redis-cli --latency

# Review application logs for bottlenecks
```

### Health Checks

```bash
# API health
curl http://localhost:3002/api/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### Performance Tuning

```bash
# Node.js memory
NODE_OPTIONS="--max-old-space-size=4096"

# PostgreSQL connections
max_connections = 100
shared_buffers = 256MB

# Redis memory
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U obfusibob obfusibob > backup.sql

# Restore
docker-compose exec -T postgres psql -U obfusibob obfusibob < backup.sql
```

### Redis Backup

```bash
# Backup
docker-compose exec redis redis-cli SAVE
docker cp obfusi-bob-redis:/data/dump.rdb ./redis-backup.rdb

# Restore
docker cp ./redis-backup.rdb obfusi-bob-redis:/data/dump.rdb
docker-compose restart redis
```

---

## Scaling

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale obfusi-bob=3

# Kubernetes
kubectl scale deployment obfusi-bob --replicas=5 -n obfusi-bob
```

### Load Balancing

Use Nginx or cloud load balancers to distribute traffic across instances.

---

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: See README.md
- Email: support@obfusi-bob.com

---

**Last Updated**: 2026-05-03  
**Version**: 1.0.0