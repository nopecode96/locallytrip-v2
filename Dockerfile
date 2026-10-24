# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Salin hanya manifest dependensi
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 1. Salin node_modules dari stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# 2. HANYA salin konfigurasi prisma & folder prisma terlebih dahulu
COPY prisma.config.ts* ./
COPY prisma ./prisma/

# 3. Generate Prisma Client di layer ini!
# Layer ini akan di-CACHE secara permanen oleh Docker selama schema prisma tidak berubah!
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate

# 4. BARU salin sisa source code aplikasi
COPY . .

# 5. Build aplikasi Next.js (Turbopack / Standalone)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ==========================================
# STAGE 3: Production Runner
# ==========================================
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin aset statis dan hasil kompilasi standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && \
    mkdir -p /app/public/images/stories \
             /app/public/images/forums \
             /app/public/images/experiences \
             /app/public/images/avatars \
             /app/public/images/general && \
    chown -R nextjs:nodejs /app/public/images && \
    chmod -R 775 /app/public/images

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
