docker compose up --build --no-deps tailwind-builder 
docker-compose --env-file .env.production build --no-cache
docker-compose --env-file .env.production up -d