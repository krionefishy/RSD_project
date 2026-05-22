FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent && npm cache clean --force

COPY . .

# Копируем production env
COPY .env.production .env

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/manifest.json /usr/share/nginx/html/manifest.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
