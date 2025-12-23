# Use Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN bun run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
