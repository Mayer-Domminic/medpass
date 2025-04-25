.PHONY: dev initdb prod down clean

# 1) Local development
dev:
	docker compose up

# 2) Seed or reseed your DB
initdb:
	docker compose run --rm initdb

# 3) Production (build & detach)
prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# 4) Tear down services (keep data)
down:
	docker compose down

# 5) Tear down & wipe DB
clean:
	docker compose down -v
