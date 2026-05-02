# Train Booking System — Microservices

SE4010 Cloud Computing Assignment | SLIIT 2026

A production-grade microservice application built with Node.js, Apache Kafka, MongoDB, Docker, and Azure Container Apps.

---

## Architecture Overview

```
Client
  └── API Gateway (nginx / Azure ALB)
        ├── Train Management Service   :3001
        ├── Seat Availability Service  :3002
        ├── Ticket Booking Service     :3003
        └── Notification Service       :3004

Async messaging: Apache Kafka
  Topics: booking.created · booking.cancelled · seat.updated · train.created

Database: MongoDB Atlas (one database per service)
  traindb · seatdb · bookingdb · notificationdb
```

## Services

| Service | Port | Responsibility | Kafka Role |
|---|---|---|---|
| Train Management | 3001 | Trains, routes, schedules | Publishes `train.created` |
| Seat Availability | 3002 | Seat inventory per schedule | Publishes `seat.updated`, subscribes `booking.cancelled` |
| Ticket Booking | 3003 | Bookings, passengers, fare | Publishes `booking.created`, `booking.cancelled` |
| Notification | 3004 | Email confirmations | Subscribes `booking.created`, `booking.cancelled` |

## Inter-Service Communication

- **Ticket Booking → Train Management** (REST): validates schedule before confirming a booking
- **Ticket Booking → Seat Availability** (REST): reserves seats atomically
- **Seat Availability** (Kafka `booking.cancelled`): releases seats on cancellation
- **Notification** (Kafka): listens on `booking.created` and `booking.cancelled` to send emails

---

## Quick Start (Local Docker)

### Prerequisites
- Docker Desktop
- Node.js 20+

### 1. Clone and configure

```bash
git clone https://github.com/your-org/train-booking-system.git
cd train-booking-system
cp .env.example .env
# Edit .env: add EMAIL_USER and EMAIL_PASS (Gmail App Password)
```

### 2. Start all services

```bash
docker compose up --build
```

All services start once Kafka and MongoDB pass health checks (~60s on first run).

### 3. Seed demo data

```bash
node seed.js
```

Creates 3 trains, 6 schedules (2 days), initialises seat inventories, and prints a sample booking payload.

### 4. Access API docs

| Service | Swagger UI |
|---|---|
| Train Management | http://localhost:3001/api-docs |
| Seat Availability | http://localhost:3002/api-docs |
| Ticket Booking | http://localhost:3003/api-docs |
| Notification | http://localhost:3004/api-docs |

---

## End-to-End Booking Flow

```
1. Search schedules
   GET :3001/api/schedules?origin=Colombo+Fort&destination=Kandy&date=2026-04-01

2. Check seat availability
   GET :3002/api/seats/<scheduleId>

3. Create booking
   POST :3003/api/bookings
   { scheduleId, trainId, seatClass, passengers, contactEmail, journeyDate, origin, destination }

   Internally:
     a) Validates schedule via Train Management (REST)
     b) Reserves seats via Seat Availability (REST)
     c) Persists booking record
     d) Publishes booking.created → Kafka → Notification Service sends email

4. Check notifications
   GET :3004/api/notifications/booking/<bookingId>

5. Cancel booking
   DELETE :3003/api/bookings/<bookingId>
     a) Releases seats via Seat Availability (REST)
     b) Publishes booking.cancelled → Kafka → Seat released + Cancellation email sent
```

---

## GitHub Actions CI/CD

Each service has its own workflow triggered on path-specific pushes to `main`:

```
.github/workflows/
  train-management.yml   → test → sonar scan → docker build → push ACR → deploy ACA
  seat-availability.yml
  ticket-booking.yml
  notification.yml
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `ACR_USERNAME` | Azure Container Registry name |
| `ACR_PASSWORD` | ACR admin password |
| `AZURE_CREDENTIALS` | JSON from `az ad sp create-for-rbac --sdk-auth` |
| `SONAR_TOKEN` | SonarCloud project token |

---

## Azure Deployment (First Time)

```bash
az login
chmod +x azure-setup.sh
./azure-setup.sh   # edit MONGO_URI and ACR_NAME in the script first
```

Provisions: Resource Group, Container Registry, Container Apps Environment, 4 Container Apps.

---

## Client Deployment (Azure Static Web Apps)

The client is configured for static export so it can be hosted on Azure Static Web Apps.

### 1. Configure client environment variables

Set these GitHub Secrets for the repository (used during the build step):

| Secret | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_TRAIN_API_URL` | `https://train-management.azurecontainerapps.io/api` | Train Management API base URL |
| `NEXT_PUBLIC_SEAT_API_URL` | `https://seat-availability.azurecontainerapps.io/api` | Seat Availability API base URL |
| `NEXT_PUBLIC_BOOKING_API_URL` | `https://ticket-booking.azurecontainerapps.io/api` | Ticket Booking API base URL |
| `NEXT_PUBLIC_NOTIFICATION_API_URL` | `https://notification.azurecontainerapps.io/api` | Notification API base URL |

### 2. Create Static Web App

Create an Azure Static Web App connected to this repo and set the deployment token as:

| Secret | Description |
|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure Static Web Apps |

### 3. Deploy

Pushing to `main` with changes under `client/` triggers the workflow:

```
.github/workflows/client.yml
```

The build outputs to `client/out` and is uploaded to Azure Static Web Apps.

---

## Security Measures

- **Non-root containers** — dedicated `appuser` in every Dockerfile
- **Helmet.js** — secure HTTP headers (CSP, HSTS, X-Frame-Options)
- **express-validator** — all endpoints validate and sanitise inputs
- **Payload size limit** — `express.json({ limit: '10kb' })`
- **Atomic seat reservation** — MongoDB conditional `findOneAndUpdate` prevents double-booking
- **Azure secrets** — credentials stored as Container App secrets, never in source code
- **SonarCloud SAST** — runs on every pull request
- **Principle of least privilege** — each service only accesses its own DB and Kafka topics

---

## Assignment Coverage

| Requirement | Implementation |
|---|---|
| 4 independent microservices | Train Mgmt, Seat Availability, Ticket Booking, Notification |
| Inter-service communication | REST (sync) + Kafka (async) — every service integrates with ≥1 other |
| CI/CD pipeline | GitHub Actions: test → SAST → build → push → deploy |
| Containerised | Docker with non-root user, health checks, layer caching |
| Cloud deployment | Azure Container Apps (consumption plan — free tier) |
| Container registry | Azure Container Registry (Basic SKU) |
| SAST | SonarCloud on every PR |
| Security best practices | Helmet, validation, secrets management, least privilege |
| OpenAPI / Swagger docs | `/api-docs` on every service |
| Public repository | All source, Dockerfiles, pipeline configs, seed data |
