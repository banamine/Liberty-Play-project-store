FROM node:18-alpine
WORKDIR /app
COPY server/package.json .
RUN npm install
COPY server/api.ts .
EXPOSE 3000
CMD ["node", "api.ts"]
