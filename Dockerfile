# Use NGINX version compatible with Alpine's packaged Brotli module
FROM nginx:1.28-alpine

# Set the base path environment variable
ENV NEXT_PUBLIC_BASE_PATH=""

# Install Brotli module directly from Alpine packages
RUN apk add --no-cache nginx-mod-http-brotli \
    && if ! grep -q 'include /etc/nginx/modules/\*\.conf;' /etc/nginx/nginx.conf; then \
         sed -i '1i include /etc/nginx/modules/*.conf;' /etc/nginx/nginx.conf; \
       fi

# Copy the pre-built static files from the CI/CD pipeline (located in the "build" directory)
COPY build /usr/share/nginx/html/${NEXT_PUBLIC_BASE_PATH}

# Copy the Nginx configuration template
COPY nginx/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# Use the custom entrypoint script to substitute env variables and start Nginx
CMD ["nginx", "-g", "daemon off;"]
