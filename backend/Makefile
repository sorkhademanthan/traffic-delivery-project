.PHONY: help dev migrate seed studio reset generate build start clean

help: ## Show this help message
    @echo "Usage: make [target]"
    @echo ""
    @echo "Targets:"
    @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

dev: ## Start development server
    npm run dev

migrate: ## Run database migrations
    npx prisma migrate dev

seed: ## Seed database with sample data
    npm run db:seed

studio: ## Open Prisma Studio
    npx prisma studio

reset: ## Reset database (WARNING: deletes all data!)
    npx prisma migrate reset

generate: ## Generate Prisma Client
    npx prisma generate

build: ## Build for production
    npm run build

start: ## Start production server
    npm start

clean: ## Clean build artifacts
    rm -rf dist node_modules

install: ## Install dependencies
    npm install

test: ## Run tests (placeholder)
    @echo "Tests not implemented yet"