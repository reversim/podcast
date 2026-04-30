# Post-production defaults — override on the command line:
#   make produce EPISODE=514 TITLE="My Episode" SLUG=my-episode DATE=2026-05-01
EPISODE  ?=
TITLE    ?=
SLUG     ?= episode-$(EPISODE)
DATE     ?= $(shell date +%Y-%m-%d)
TAGS        ?=
COVER_IMAGE ?=
WORKDIR  ?= /tmp/reversim-$(EPISODE)
BAND_DIR ?= $(shell find $(HOME)/Music/GarageBand -maxdepth 1 -name "reversim$(EPISODE)*.band" | head -1)
INTRO    ?= assets/intro.mp3
OUTRO    ?= assets/outro.mp3

# Derived names
MP3_NAME  = reversim$(EPISODE)-$(shell echo $(SLUG) | tr '-' '_').mp3
AUDIO_URL = https://m2.reversim.com/$(MP3_NAME)

.PHONY: help install dev build build-pages preview migrate validate audit rss-compare verify clean \
        produce produce-mix produce-audio produce-transcribe produce-post produce-upload

help:
	@echo "Site targets:"
	@echo "  install      Install dependencies"
	@echo "  dev          Run local dev server"
	@echo "  build        Build production site"
	@echo "  build-pages  Build for GitHub Pages (www.reversim.com)"
	@echo "  preview      Preview production build"
	@echo "  migrate      Migrate posts from Blogger"
	@echo "  validate     Validate migration counts"
	@echo "  audit        Audit migration quality"
	@echo "  rss-compare  Compare source RSS vs generated feeds"
	@echo "  verify       Run full verification suite"
	@echo "  clean        Remove build artifacts"
	@echo ""
	@echo "Post-production targets (require EPISODE=NNN TITLE='...' SLUG=slug):"
	@echo "  produce            Full pipeline: mix → audio → transcribe → post → upload"
	@echo "  produce-mix        Mix GarageBand WAV tracks into a single MP3"
	@echo "  produce-audio      Add intro/outro, normalize"
	@echo "  produce-transcribe Transcribe with Gemini, save transcript"
	@echo "  produce-post       Generate Hebrew blog post from transcript"
	@echo "  produce-upload     Upload processed MP3 to S3"
	@echo ""
	@echo "Example:"
	@echo "  make produce EPISODE=514 TITLE='כותרת פרק' SLUG=my-episode TAGS=tag1 COVER_IMAGE=/images/ep514.jpg"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

build-pages:
	npm run build

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

# ── Post-production ──────────────────────────────────────────────────────────

_check-episode:
	@test -n "$(EPISODE)" || (echo "ERROR: EPISODE is required  (e.g. make produce EPISODE=513 TITLE='...' SLUG=slug)"; exit 1)
	@test -n "$(TITLE)"   || (echo "ERROR: TITLE is required"; exit 1)
	@test -n "$(SLUG)"    || (echo "ERROR: SLUG is required"; exit 1)

_post-production-args = \
	--episode $(EPISODE) \
	--title "$(TITLE)" \
	--date $(DATE) \
	--slug $(SLUG) \
	--workdir $(WORKDIR) \
	--intro "$(INTRO)" \
	--outro "$(OUTRO)" \
	$(if $(TAGS),--tags "$(TAGS)") \
	$(if $(COVER_IMAGE),--cover-image "$(COVER_IMAGE)")

produce-mix: _check-episode
	@set -a && . ./.env && set +a && \
	node scripts/post-production.mjs $(_post-production-args) \
		--mix-wavs "$(BAND_DIR)" \
		--skip-audio --skip-transcribe --skip-post --skip-upload

produce-audio: _check-episode
	@set -a && . ./.env && set +a && \
	node scripts/post-production.mjs $(_post-production-args) \
		--mix-wavs "$(BAND_DIR)" \
		--skip-mix --skip-transcribe --skip-post --skip-upload

produce-transcribe: _check-episode
	@set -a && . ./.env && set +a && \
	node scripts/post-production.mjs $(_post-production-args) \
		--mix-wavs "$(BAND_DIR)" \
		--skip-mix --skip-audio --skip-post --skip-upload

produce-post: _check-episode
	@set -a && . ./.env && set +a && \
	node scripts/post-production.mjs $(_post-production-args) \
		--mix-wavs "$(BAND_DIR)" \
		--skip-mix --skip-audio --skip-transcribe --skip-upload

produce-upload: _check-episode
	@set -a && . ./.env && set +a && \
	node scripts/post-production.mjs $(_post-production-args) \
		--mix-wavs "$(BAND_DIR)" \
		--skip-mix --skip-audio --skip-transcribe --skip-post

produce: _check-episode
	@set -a && . ./.env && set +a && \
	node scripts/post-production.mjs $(_post-production-args) \
		--mix-wavs "$(BAND_DIR)"
