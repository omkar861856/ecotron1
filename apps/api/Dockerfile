FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm build --filter api...

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app ./

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start"]
