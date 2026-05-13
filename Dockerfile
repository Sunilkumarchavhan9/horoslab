FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/memoryos?schema=public
RUN npx prisma generate

COPY . .
RUN mkdir -p /app/default-data/eval \
  && cp /app/data/eval/best-config.json /app/default-data/eval/best-config.json \
  && cp /app/data/eval/baseline-report.json /app/default-data/eval/baseline-report.json \
  && cp /app/data/eval/benchmark-cases.json /app/default-data/eval/benchmark-cases.json \
  && if [ -f /app/data/eval/benchmark-report.json ]; then cp /app/data/eval/benchmark-report.json /app/default-data/eval/benchmark-report.json; fi
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
