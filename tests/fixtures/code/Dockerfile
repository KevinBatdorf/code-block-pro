# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm run build

FROM nginx:stable
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
