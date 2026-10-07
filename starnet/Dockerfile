# Google Cloud Run Dockerfile for StarNet Sidecar & Visual Harness
FROM node:20-slim

# Install system build dependencies for native modules (node-pty)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first for caching
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev --ignore-scripts || npm install --omit=dev

# Copy entire application source
COPY . .

# Cloud Run injects PORT (default 8080); listen on all interfaces
ENV STARNET_HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

# Start StarNet sidecar host
CMD ["node", "sidecar/index.js"]
