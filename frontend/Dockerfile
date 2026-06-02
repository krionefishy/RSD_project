FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_DEMO_MODE=true
ARG VITE_API_URL=/api/v1

ENV VITE_DEMO_MODE=$VITE_DEMO_MODE
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --silent && npm cache clean --force

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/manifest.json /usr/share/nginx/html/manifest.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
