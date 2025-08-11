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

# Accept build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_APP_URL
ARG VITE_PWA_URL
ARG VITE_LANDING_URL
ARG VITE_ENABLE_ANALYTICS
ARG VITE_GA_TRACKING_ID

# Set environment variables from build arguments
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_PWA_URL=$VITE_PWA_URL
ENV VITE_LANDING_URL=$VITE_LANDING_URL
ENV VITE_ENABLE_ANALYTICS=$VITE_ENABLE_ANALYTICS
ENV VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID

# Build all applications with environment variables available
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
