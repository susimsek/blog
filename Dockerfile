FROM nginx:1.28-alpine

ENV NEXT_PUBLIC_BASE_PATH=""

RUN set -eux; \
    apk add --no-cache --virtual .brotli-build-deps \
      cmake \
      g++ \
      gcc \
      git \
      make \
      musl-dev \
      pcre2-dev \
      zlib-dev; \
    NGINX_VERSION="$(nginx -v 2>&1 | sed -n 's|nginx version: nginx/||p')"; \
    wget -O "/tmp/nginx-${NGINX_VERSION}.tar.gz" "https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz"; \
    tar -xzf "/tmp/nginx-${NGINX_VERSION}.tar.gz" -C /tmp; \
    git clone --recurse-submodules https://github.com/google/ngx_brotli.git /tmp/ngx_brotli; \
    mkdir -p /tmp/ngx_brotli/deps/brotli/out; \
    cd /tmp/ngx_brotli/deps/brotli/out; \
    cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON ..; \
    cmake --build . --parallel; \
    cd "/tmp/nginx-${NGINX_VERSION}"; \
    ./configure --with-compat --add-dynamic-module=/tmp/ngx_brotli; \
    make modules; \
    mkdir -p /usr/lib/nginx/modules /etc/nginx/modules; \
    cp objs/ngx_http_brotli_filter_module.so /usr/lib/nginx/modules/ngx_http_brotli_filter_module.so; \
    cp objs/ngx_http_brotli_static_module.so /usr/lib/nginx/modules/ngx_http_brotli_static_module.so; \
    printf '%s\n%s\n' \
      'load_module /usr/lib/nginx/modules/ngx_http_brotli_filter_module.so;' \
      'load_module /usr/lib/nginx/modules/ngx_http_brotli_static_module.so;' \
      > /etc/nginx/modules/brotli.conf; \
    if ! grep -q 'include /etc/nginx/modules/\*\.conf;' /etc/nginx/nginx.conf; then \
      sed -i '1i include /etc/nginx/modules/*.conf;' /etc/nginx/nginx.conf; \
    fi; \
    apk del .brotli-build-deps; \
    rm -rf "/tmp/nginx-${NGINX_VERSION}" "/tmp/nginx-${NGINX_VERSION}.tar.gz" /tmp/ngx_brotli /var/cache/apk/*

COPY build /usr/share/nginx/html/${NEXT_PUBLIC_BASE_PATH}
COPY nginx/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
