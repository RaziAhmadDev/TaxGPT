# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build your application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to start your app
CMD ["npm", "start"]
