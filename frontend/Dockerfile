# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent && npm cache clean --force

COPY . .
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy built app (Vite outputs to dist/, not build/)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy manifest.json explicitly
COPY --from=builder /app/dist/manifest.json /usr/share/nginx/html/manifest.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
