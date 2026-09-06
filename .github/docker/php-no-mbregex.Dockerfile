# syntax=docker/dockerfile:1
ARG PHP_VERSION=8.4.24

FROM debian:bookworm-slim AS build
ARG PHP_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends \
	autoconf bison build-essential ca-certificates curl \
	libcurl4-openssl-dev libsqlite3-dev libssl-dev libxml2-dev \
	pkg-config re2c zlib1g-dev \
	&& rm -rf /var/lib/apt/lists/*
RUN curl -fsSL "https://www.php.net/distributions/php-${PHP_VERSION}.tar.gz" -o /tmp/php.tar.gz \
	&& mkdir -p /usr/src/php && tar -xzf /tmp/php.tar.gz -C /usr/src/php --strip-components=1
WORKDIR /usr/src/php
# libonig is left out so the build fails instead of quietly keeping mbregex.
RUN ./configure \
	--prefix=/usr/local \
	--with-config-file-path=/usr/local/etc/php \
	--with-config-file-scan-dir=/usr/local/etc/php/conf.d \
	--enable-mbstring \
	--disable-mbregex \
	--enable-mysqlnd \
	--with-mysqli=mysqlnd \
	--with-pdo-mysql=mysqlnd \
	--with-openssl \
	--with-curl \
	--with-zlib \
	--with-iconv \
	&& make -j"$(nproc)" && make install
RUN php -r 'if (function_exists("mb_ereg_search_init")) { fwrite(STDERR, "mbregex is present, the build is wrong\n"); exit(1); }' \
	&& php -r 'if (!extension_loaded("mbstring")) { fwrite(STDERR, "mbstring is missing, the build is wrong\n"); exit(1); }'

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates curl git libcurl4 libsqlite3-0 libxml2 unzip zlib1g \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=build /usr/local /usr/local
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN mkdir -p /usr/local/etc/php/conf.d
