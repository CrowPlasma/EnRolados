FROM node:20-slim AS base

FROM base AS builder
# Instalar dependencias necesarias para compilar módulos nativos (bcrypt, prisma)
RUN apt-get update && apt-get install -y openssl python3 make g++
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código y prisma
COPY . .
RUN npx prisma generate

# Construir Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="cyberpunk_super_secret_key_2026_soc_turnos_!@"

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/dev.db ./dev.db

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Cambiar permisos de la base de datos para que el usuario nextjs pueda escribir
RUN chown -R nextjs:nodejs /app

# Run as root to avoid sqlite volume permission issues
# USER nextjs

EXPOSE 3000

ENV PORT 3000

# Usar db push para sincronizar el esquema automáticamente sin requerir historial de migraciones
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
