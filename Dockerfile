# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM gcr.io/distroless/nodejs24-debian13:nonroot
WORKDIR /app
# The DB columns are timestamp without time zone and node-postgres reads
# them in the process time zone, so it must match the database (UTC).
ENV TZ=UTC
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./
EXPOSE 3001
CMD ["dist/main.js"]
