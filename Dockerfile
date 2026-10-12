# Container image for the OmniForce MCP server (stdio transport).
#
# Build:  docker build -t omniforce-mcp .
# Run:    docker run -i --rm -e OMNIFORCE_API_KEY=omk_... omniforce-mcp
#
# The server speaks MCP over stdio, so it must be run attached (-i).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
ENTRYPOINT ["node", "dist/index.js"]
