# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*
RUN npm install

# Bundle app's source
COPY . .

# Copy the wait-for-mongo.sh script
COPY wait-for-mongo.sh /usr/local/bin/wait-for-mongo.sh

# Make the script executable
RUN chmod +x /usr/local/bin/wait-for-mongo.sh

# Make port 3003 available to the world outside this container
EXPOSE 3003

# Define the command to run your app, using the wait-for-mongo.sh script
CMD [ "wait-for-mongo.sh" ]
