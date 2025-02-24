# Use the smallest possible NGINX base image
FROM nginx:alpine

# Set the base path environment variable
ENV NEXT_PUBLIC_BASE_PATH=/blog

# Copy the pre-built static files from the CI/CD pipeline (located in the "build" directory)
COPY build /usr/share/nginx/html/${NEXT_PUBLIC_BASE_PATH}

# Copy the Nginx configuration template
COPY nginx/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# Use the custom entrypoint script to substitute env variables and start Nginx
CMD ["nginx", "-g", "daemon off;"]
