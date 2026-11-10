# Сборка
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# База для пререндеринга каталога при сборке; рабочая база живёт в томе /app/data
ENV DATABASE_PATH=/tmp/build.db
# Значения NEXT_PUBLIC_* встраиваются в сборку, поэтому передаются здесь
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SHOP_DEMO=0
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL     NEXT_PUBLIC_SHOP_DEMO=$NEXT_PUBLIC_SHOP_DEMO
RUN npm run build

# Запуск: только самодостаточная сборка Next.js
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/app/data/morphinum.db

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server.js"]
