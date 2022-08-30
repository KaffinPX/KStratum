FROM node:16-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
COPY package*.json ./

RUN npm install
USER node
COPY --chown=node:node . .

EXPOSE 16110
EXPOSE 16112

# Modify the parameters here to reflect your Node, Wallet, Port, and Listening Address.
CMD [ "node", "index.js", "--node", "79.120.76.62:16110","--port","16112", "--address", "kaspa:qz34dfrhnmljnp4ymm4p4uukphjg3ty3auv0jktugv4wx4w8jwdh7zwjka8x8", "--listen-address", "0.0.0.0" ]
