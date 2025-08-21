# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the frontend application code
COPY . .

# Your app binds to port 3000, so expose it
EXPOSE 3000

# Define the command to run the app using nodemon
CMD [ "npx", "nodemon", "server.js" ]
