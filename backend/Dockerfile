FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "if [ \"$USE_MEMORY_STORE\" = \"false\" ]; then npm run db:migrate && npm run db:seed; fi && npm start"]
