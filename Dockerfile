FROM node:18-alpine

# Install pkg globally
RUN npm install -g pkg

# Create app directory
WORKDIR /app

# Copy package and source
COPY . .

# Install dependencies
RUN npm install

# Build the executable binary
RUN mkdir -p dist && \
    pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --out-path dist

# Default command: list dist folder contents
CMD ["ls", "-lh", "dist"]
