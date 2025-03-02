# Build stage
FROM node:16-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set API URL for production
ARG API_URL=http://localhost:3000
ENV VUE_APP_API_BASE_URL=${API_URL}

RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy built files from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Add nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
