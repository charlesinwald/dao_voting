# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for installing node modules
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the current directory contents into the container at /usr/src/app
COPY . .


# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run app
CMD [ "npm", "start" ]
