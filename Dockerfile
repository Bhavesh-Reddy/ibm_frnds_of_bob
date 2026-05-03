# Obfusi-Bob Production Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build MCP Server
FROM node:20-alpine AS mcp-builder

WORKDIR /app/mcp-server

# Copy MCP server files
COPY mcp-server/package*.json ./
COPY mcp-server/tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -g typescript

# Copy source code
COPY mcp-server/src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine

# Install LLVM tools (optional, for actual obfuscation)
RUN apk add --no-cache \
    llvm15 \
    llvm15-dev \
    clang15

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY mcp-server/package*.json ./mcp-server/

# Install production dependencies
RUN cd mcp-server && npm ci --only=production

# Copy built MCP server
COPY --from=mcp-builder /app/mcp-server/dist ./mcp-server/dist

# Copy application files
COPY api-server.js ./
COPY login.html ./
COPY dashboard.html ./
COPY README.md ./

# Create directories
RUN mkdir -p test-samples logs

# Copy test samples
COPY test-samples ./test-samples

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002
ENV LOG_LEVEL=info

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "api-server.js"]

# Made with Bob
