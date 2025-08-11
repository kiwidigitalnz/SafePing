# Multi-stage build for SafePing monorepo
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/landing/package.json ./apps/landing/
COPY apps/web/package.json ./apps/web/
COPY apps/pwa/package.json ./apps/pwa/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all applications
RUN pnpm run build

# Production stage with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-app.conf /etc/nginx/conf.d/default.conf

# Copy built applications
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html/landing
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html/web
COPY --from=builder /app/apps/pwa/dist /usr/share/nginx/html/pwa

# Create a simple health check endpoint
RUN echo "OK" > /usr/share/nginx/html/health

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
