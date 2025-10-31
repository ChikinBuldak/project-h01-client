# Base Stage
FROM oven/bun:1 as base
WORKDIR /usr/src/app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .

# Dev Stage
FROM base as dev
ENV NODE_ENV=development
EXPOSE 5173
CMD [ "bun", "run", "dev" ]

# Build Stage (Staging)
FROM base as staging
ARG STAGE=staging
ENV VITE_APP_STAGE=${STAGE}
RUN bun run build --mode ${STAGE}

# Build Stage (Prod)
FROM base as production
ARG STAGE=production
ENV VITE_APP_STAGE=${STAGE}
RUN bun run build --mode ${STAGE}

# Runtime Image
FROM nginx:1.29-alpine as runtime
WORKDIR /usr/share/nginx/html
COPY --from=production /usr/src/app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
