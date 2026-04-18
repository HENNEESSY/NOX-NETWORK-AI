FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["npx", "tsx", "server.ts"]
