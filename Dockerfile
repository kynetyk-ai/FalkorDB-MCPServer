FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production image
FROM node:18-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Default to stdio mode for MCP compatibility
# Use: docker run -i falkordb-mcpserver (for stdio/Claude Desktop)
# Use: docker run -p 3000:3000 falkordb-mcpserver node dist/index.js (for HTTP)
CMD ["node", "dist/stdio.js"]