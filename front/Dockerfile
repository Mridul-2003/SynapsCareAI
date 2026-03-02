FROM node:20-alpine AS deps

WORKDIR /app

# Copy package manifest and lockfiles first for better build caching
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies using the available lockfile
RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && \
    pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Use a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy only what is needed to run the built app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY package.json ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]

