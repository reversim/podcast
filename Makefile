.PHONY: help install dev build build-pages preview migrate validate audit rss-compare verify clean

help:
	@echo "Targets:"
	@echo "  install   Install dependencies"
	@echo "  dev       Run local dev server"
	@echo "  build     Build production site"
	@echo "  build-pages Build for GitHub Pages (/podcast)"
	@echo "  preview   Preview production build"
	@echo "  migrate   Migrate posts from Blogger (sitemap-driven)"
	@echo "  validate  Validate migration counts"
	@echo "  audit     Audit migration quality (sampled title/tag checks)"
	@echo "  rss-compare Compare source RSS vs generated feeds"
	@echo "  verify    Run full verification suite"
	@echo "  clean     Remove build artifacts"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

build-pages:
	ASTRO_BASE=/podcast ASTRO_SITE=https://reversim.github.io npm run build

preview:
	npm run preview

migrate:
	npm run migrate:blogger

validate:
	npm run migrate:validate

audit:
	npm run migrate:audit

rss-compare:
	npm run rss:compare

verify:
	$(MAKE) validate
	$(MAKE) audit
	$(MAKE) build-pages
	$(MAKE) rss-compare

clean:
	rm -rf dist .astro
