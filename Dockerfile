# Use the smallest possible NGINX base image
FROM nginx:alpine

# Set the base path environment variable
ENV NEXT_PUBLIC_BASE_PATH=/blog

# Copy the pre-built static files from the CI/CD pipeline (located in the "build" directory)
COPY build /usr/share/nginx/html/${NEXT_PUBLIC_BASE_PATH}

# Copy the Nginx configuration template
COPY nginx/nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy the entrypoint script and make it executable
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use the custom entrypoint script to substitute env variables and start Nginx
CMD ["/docker-entrypoint.sh"]
