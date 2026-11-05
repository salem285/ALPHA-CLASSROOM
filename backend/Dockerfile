# ===================================================
# Stage 1: Build stage
# ===================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies needed for Prisma compilation on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code and configuration
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Compile TypeScript to JavaScript in dist/
RUN npm run build

# Remove development dependencies to keep footprint minimal
RUN npm prune --omit=dev

# ===================================================
# Stage 2: Production runtime stage
# ===================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime OpenSSL for Prisma engine
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

# Create dedicated non-root application user for security hardening
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production node_modules (with generated Prisma client) and compiled dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create upload directory with non-root ownership
RUN mkdir -p /app/uploads/recordings && \
    chown -R nestjs:nodejs /app/uploads

USER nestjs

EXPOSE 4000

# Run migrations and start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
