# Stage 1: Build Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY app/frontend/package.json ./
RUN npm install
COPY app/frontend ./
RUN npm run build

# Stage 2: Python Backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY app/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY app/backend/*.py ./

# Copy Frontend Build to Metadata
COPY --from=frontend-build /app/frontend/dist ./static

# Create data directory
RUN mkdir -p /data
VOLUME /data

# Expose port
EXPOSE 3333

# Run Application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3333"]
