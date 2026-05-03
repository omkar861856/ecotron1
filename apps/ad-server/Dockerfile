FROM node:22-alpine

WORKDIR /app

COPY apps/ad-server/package.json ./
RUN npm install --omit=dev

COPY apps/ad-server/ .

EXPOSE 8080

ENTRYPOINT []
CMD ["node", "index.js"]
