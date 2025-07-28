# Stage 1: Compile and Build angular codebase

# Use official node image as the base image
FROM node:latest as build

# Set the working directory
WORKDIR /app

# Add the source code to app
COPY . ./

# Install all the dependencies
RUN npm install --legacy-peer-deps

# Generate the build of the application
RUN npm run build:prod


# Stage 2: Serve app with nginx server
# Use official nginx image as the base image
FROM nginx:latest

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist/deberia-desplegar-hoy/browser /usr/share/nginx/html

# Expose port 91
EXPOSE 91

CMD ["nginx", "-g", "daemon off;"]
