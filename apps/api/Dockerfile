FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm build --filter api...

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist/index.js ./index.js
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 3001
CMD ["node", "index.js"]
