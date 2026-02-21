#!/bin/bash
# Quick setup for Redis caching in roomFind

echo "🚀 Setting up Redis caching for roomFind"
echo ""

# Option 1: Local Redis (development)
echo "Option 1: Local Redis (recommended for development)"
echo "Install Docker: https://www.docker.com/products/docker-desktop"
echo "Then run:"
echo ""
echo "  docker run -d -p 6379:6379 --name roomfind-redis redis:7-alpine"
echo ""
echo "Add to .env.local:"
echo "  REDIS_URL=redis://localhost:6379"
echo ""

# Option 2: Upstash (serverless, recommended for production)
echo "─────────────────────────────────────────────────"
echo ""
echo "Option 2: Upstash Redis (recommended for production)"
echo "1. Sign up at https://console.upstash.com/"
echo "2. Create a new Redis database"
echo "3. Copy connection string from 'Connect' tab"
echo "4. Add to .env.local:"
echo "  REDIS_URL=redis://<default>:<password>@<host>:<port>"
echo ""

# Install dependencies
echo "─────────────────────────────────────────────────"
echo ""
echo "Installing dependencies..."
npm install redis

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Choose Redis host (local Docker or Upstash)"
echo "2. Add REDIS_URL to .env.local"
echo "3. Start using Redis in API routes (see examples/redis-integration-example.js)"
echo "4. Monitor cache performance with Redis CLI:"
echo ""
echo "   redis-cli"
echo "   > INFO"
echo "   > KEYS *"
echo "   > TTL <key>"
