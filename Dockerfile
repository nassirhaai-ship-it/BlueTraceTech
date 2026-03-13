FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose ports for Next.js and WebSocket server
EXPOSE 3000 4001

# Set environment variables
ENV NODE_ENV=production
ENV WS_PORT=4001
ENV API_BASE_URL=http://localhost:3000

# Start both Next.js and WebSocket server
CMD ["npm", "start"] 