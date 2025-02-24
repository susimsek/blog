# Use the smallest possible NGINX base image
FROM nginx:alpine

# Copy the pre-built static files from the CI/CD pipeline (located in the "build" directory)
COPY build /usr/share/nginx/html

# Replace the default NGINX configuration with a custom one for optimized performance
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow HTTP traffic
EXPOSE 80

# Start NGINX in the foreground to keep the container running
CMD ["nginx", "-g", "daemon off;"]
