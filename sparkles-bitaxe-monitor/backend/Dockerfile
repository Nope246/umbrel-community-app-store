FROM node:18-alpine

WORKDIR /app

# Copy package file
COPY package.json ./

# Install dependencies (use npm install since package-lock may not be present)
RUN npm install --only=production

# Copy application files after installing deps to leverage Docker layer caching
COPY . .

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
