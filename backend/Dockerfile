FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies while skipping the husky prepare script
RUN npm set-script prepare ""
RUN npm ci --production

# Copy the rest of the application
COPY . .

# Set proper permissions for the token.json directory
RUN mkdir -p /app/data
RUN chmod 777 /app/data

EXPOSE 3000
CMD ["node", "server.js"]