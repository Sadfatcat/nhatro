FROM node:20-alpine AS build
WORKDIR /workspace
COPY . .
RUN npm ci
RUN npm run build --workspace=@nhatro/cms -- --configuration=production

FROM caddy:2-alpine
COPY --from=build /workspace/apps/cms/dist/cms/browser /srv/cms
COPY apps/cms/Caddyfile /etc/caddy/Caddyfile
