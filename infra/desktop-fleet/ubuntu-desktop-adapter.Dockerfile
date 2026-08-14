FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

COPY ubuntu-desktop-adapter.mjs /app/ubuntu-desktop-adapter.mjs

RUN npm init -y \
  && npm install --omit=dev playwright-core@1.57.0

ENV PORT=3090
EXPOSE 3090

CMD ["node", "/app/ubuntu-desktop-adapter.mjs"]
