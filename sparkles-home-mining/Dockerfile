# Use Node.js LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package*.json ./

# Install root dependencies (including dev dependencies for building)
RUN npm install

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install frontend dependencies
RUN cd frontend && npm install && cd ..

# Copy all application code
COPY . .

# Build the frontend
RUN npm run build:frontend

# Remove dev dependencies and frontend node_modules to reduce image size
RUN npm prune --production
RUN rm -rf frontend/node_modules

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
