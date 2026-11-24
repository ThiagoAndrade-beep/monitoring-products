FROM node:22-bookworm-slim

# O scraper (Puppeteer/Chromium) roda fora do deploy, no worker local em scraper/.

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3000
CMD ["npm", "start"]
