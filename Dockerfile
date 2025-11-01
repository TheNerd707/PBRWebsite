# Use the official Python image as a base
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /website 

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]