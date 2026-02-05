.PHONY: help install dev build preview migrate validate lint clean

help:
	@echo "Targets:"
	@echo "  install   Install dependencies"
	@echo "  dev       Run local dev server"
	@echo "  build     Build production site"
	@echo "  preview   Preview production build"
	@echo "  migrate   Migrate posts from Blogger (sitemap-driven)"
	@echo "  validate  Validate migration counts"
	@echo "  clean     Remove build artifacts"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

migrate:
	npm run migrate:blogger

validate:
	npm run migrate:validate

clean:
	rm -rf dist .astro
