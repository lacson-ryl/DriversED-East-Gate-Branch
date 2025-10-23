# Stage 1: Builder
FROM node:20 AS builder
WORKDIR /app

# Install dependencies
COPY public-site/package*.json ./
RUN npm install

# Copy public-site specific files
COPY public-site/web-pub-server.js ./
COPY public-site/views ./views
COPY public-site/f-jsfiles ./f-jsfiles
COPY public-site/middleware ./middleware
COPY public-site/utils ./utils
COPY public-site/utils-backend ./utils-backend
COPY public-site/config ./config
COPY public-site/controllers ./controllers

# Stage 2: Runtime
FROM node:20-slim
WORKDIR /app

# Install required dependencies for Chrome and fonts (English only)
RUN apt-get update && apt-get install -y \
  wget \
  curl \
  unzip \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libxss1 \
  libgtk-3-0 \
  libstdc++6 \
  libxext6 \
  --no-install-recommends && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# ✅ Install Chrome for Testing (version 117.0.5938.92)
RUN curl -LO https://storage.googleapis.com/chrome-for-testing-public/117.0.5938.92/linux64/chrome-linux64.zip && \
  unzip chrome-linux64.zip && \
  mv chrome-linux64 /opt/chrome && \
  ln -sf /opt/chrome/chrome /usr/bin/google-chrome-stable && \
  rm chrome-linux64.zip

# Copy public-site specific files
COPY public-site/web-pub-server.js ./
COPY public-site/views ./views
COPY public-site/f-jsfiles ./f-jsfiles
COPY public-site/middleware ./middleware
COPY public-site/utils ./utils
COPY public-site/utils-backend ./utils-backend
COPY public-site/config ./config
COPY public-site/controllers ./controllers

# Copy app files and Puppeteer browser cache
COPY --from=builder /root/.cache/puppeteer /root/.cache/puppeteer

# Install runtime dependencies and global tools as root
RUN npm install

# Create non-root user for Puppeteer
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser && \
  mkdir -p /home/pptruser/Downloads && \
  chown -R pptruser:pptruser /home/pptruser /app

# Switch to non-root user
USER pptruser

# Skip Puppeteer download since we already installed Chrome
ENV PUPPETEER_SKIP_DOWNLOAD=true

EXPOSE 8000

HEALTHCHECK CMD curl --fail http://localhost:8000 || exit 1
CMD ["npm", "run", "start"]
