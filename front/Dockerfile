# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && \
    pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# Stage 2: Builder
FROM node:22-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Fix Alpine CVEs
RUN apk add --no-cache --upgrade zlib libssl3 libcrypto3 || true

# npm remove karo — runtime mein zaroorat nahi, vulnerabilities bhi saath jaayengi
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone output — node_modules ki zaroorat nahi runner mein
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]