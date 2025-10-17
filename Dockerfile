# Stage 1: Builder
FROM node:20 AS builder
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY ./b-server.js ./f-tailcss ./f-css ./views ./f-jsfiles ./config ./utils ./middleware ./controllers ./tailwind.config.js ./

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Install app dependencies again (needed in final image)
COPY package*.json ./
RUN npm install

# Install global dev tools
RUN npm install -g concurrently tailwindcss nodemon

# Alpine setup
RUN apk update && apk upgrade

EXPOSE 8000
CMD ["npm", "run", "dev"]
