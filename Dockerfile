# Build the application
FROM node:14.16.0-alpine3.12 as builder
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN npm run ng build --prod

# Run the application
FROM nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /dist/

