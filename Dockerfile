FROM node:18-slim

RUN mkdir -p /srv/discord-bot

WORKDIR /srv/discord-bot

COPY package.json package-lock.json ./

RUN npm install
RUN apt update
RUN apt install git -y

COPY . ./

# Start production here
CMD ["npm", "run", "start"]