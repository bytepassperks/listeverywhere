FROM node:22-slim

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

RUN npx playwright install --with-deps chromium

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
