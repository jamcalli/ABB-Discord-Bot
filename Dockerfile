# Use the latest official Node.js runtime as the base image
FROM node:latest

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the directory
COPY package*.json ./

# Install the application dependencies inside the container
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Define the command to run the application
CMD [ "npm", "start" ]