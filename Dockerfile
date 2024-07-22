# Use an official Node runtime as a parent image
FROM node:18-bullseye AS build


# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN npm run build

# Use a smaller base image for the final build
FROM node:18-bullseye-slim AS runtime

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install only production dependencies
RUN npm install

# Copy the built application from the build image
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/.env ./.env

# Expose the port the app runs on
EXPOSE 4000

# Define environment variable
ENV NODE_ENV=production

# Command to run the app
CMD ["node", "dist/index.js"]
