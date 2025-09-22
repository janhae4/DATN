# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build task-service
RUN npm run build task-service

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy node_modules từ builder
COPY --from=builder /app/node_modules ./node_modules

# Copy dist và package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3002

# Start microservice in prod mode
CMD ["npm", "run", "start:prod", "task-service"]
