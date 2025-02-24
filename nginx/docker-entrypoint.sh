#!/bin/sh
# Replace the placeholder in the template file using sed
sed -e "s#__NEXT_PUBLIC_BASE_PATH__#${NEXT_PUBLIC_BASE_PATH}#g" \
    /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx in the foreground
exec nginx -g 'daemon off;'
