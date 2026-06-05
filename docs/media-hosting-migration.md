# Media hosting migration: S3 → Cloudflare R2

Record of the audio-hosting setup **before** the cutover from Amazon S3 to
Cloudflare R2, captured so we can roll back cleanly if needed.

Captured: 2026-06-04.

## Why

Podcast audio was served from S3 and the bill was driven almost entirely by
egress (`DataTransfer-Out-Bytes`) — ~71% of the S3 cost, growing fast
(May 2026 hit ~$19 in egress alone). R2 has **zero egress fees**, so moving
the bucket eliminates that line item and decouples cost from download volume.

## Pre-cutover setup (rollback target)

### Storage — Amazon S3 (source)
- Bucket: `reversim`
- Region: `us-east-1` (LocationConstraint `null`)
- AWS account: `115652952820` (IAM user `reversim-files`)
- Local access: `aws --profile reversim` (creds in `~/.aws/credentials`)
- Contents at capture: **755 objects / 23.9 GiB**, all `STANDARD`, **versioning OFF**

### Delivery — Cloudflare (zone `reversim.com`, id `27cb252d201055df7379397235c9551a`)
Two media hostnames, both **proxied** (orange-cloud) through Cloudflare:

- `m.reversim.com`  → Cloudflare anycast (`104.21.40.242`, `172.67.140.97`)
- `m2.reversim.com` → Cloudflare anycast (`104.21.40.242`, `172.67.140.97`)

Cloudflare does **not** serve the bytes — it issues a path-preserving **302
redirect** to the raw S3 URL, and S3 serves the file. So every byte was billed
S3 egress (Cloudflare added zero caching benefit).

**Redirect mechanism: a Single Redirect Rule** (zone phase
`http_request_dynamic_redirect`). Confirmed by elimination:
- Page Rules: **none** (count 0)
- Workers routes on zone: **none**
- (DNS records and rulesets could not be read via the wrangler OAuth token —
  scope is `zone:read` only, which does not cover DNS/rulesets read.)

Observed behavior (the thing rollback must restore):

```
$ curl -sI https://m2.reversim.com/reversim458-MAX.mp3
HTTP/2 302
location: https://reversim.s3.amazonaws.com/reversim458-MAX.mp3
server: cloudflare

$ curl -sI https://m.reversim.com/reversim458-MAX.mp3
HTTP/2 302
location: https://reversim.s3.amazonaws.com/reversim458-MAX.mp3
server: cloudflare
```

**Exact rules (Single Redirect, wildcard matching mode) — both confirmed from the dashboard:**

```
# m2.reversim.com
Request URL:  http*://m2.reversim.com/*
Target URL:   https://reversim.s3.amazonaws.com/${2}
Status code:  302

# m.reversim.com
Request URL:  http*://m.reversim.com/*
Target URL:   https://reversim.s3.amazonaws.com/${2}
Status code:  302
```

Capture-group semantics: `${1}` = the `*` in `http*` (the optional `s`),
`${2}` = the path after the first `/`. So `https://m2.reversim.com/foo.mp3`
→ `302` → `https://reversim.s3.amazonaws.com/foo.mp3` (and likewise for `m.`).

## Post-cutover setup (target state)

- R2 bucket: `reversim`
- Cloudflare account: `bddcd14d3bb33ee6bdb8cfff3cab9b37`
- Migration: Super Slurper job `f09912d27376e284a1d5778dd5e951bbdccddd0392fe7affa21879800a48fe52`
  — completed, 755/755 transferred, 0 skipped, 0 failed. Verified R2 = 755
  objects / 23.9 GiB, per-file size spot checks match.
- R2 S3-API token: created in dashboard, scoped to bucket `reversim`
  (Object Read & Write). Stored locally at `~/.r2-reversim-creds` — **not in repo**.
- Cutover (pending): remove the Redirect Rule above, then attach
  `m2.reversim.com` (and `m.reversim.com`) as **R2 custom domains** so
  Cloudflare serves bytes natively at $0 egress.

Repo-side change already shipped (commit `47f2c4e`): 11 episodes that hardcoded
raw `s3.amazonaws.com/reversim/...` URLs were rewritten to `m2.reversim.com`
so all audio routes through the swappable custom domain.

## Cutover completed — 2026-06-05

The two `m.`/`m2.` redirect rules were deleted; both hostnames now serve audio
natively from R2 (HTTP 200, `content-type: audio/mpeg`, range/`206` supported).
S3 retained as the rollback origin.

**Gotcha hit during cutover (important for any future re-provision):** the R2
custom-domain certificates sat stuck in `ssl: pending` for ~45 min because the
wildcard redirect rule (`http*://m2.reversim.com/*`) also matched the cert's
HTTP domain-control-validation path (`/.well-known/...`) and 302'd it to S3, so
validation could never complete. Fix: add `and not
(starts_with(http.request.uri.path, "/.well-known/"))` to the redirect rule(s)
so the DCV challenge reaches Cloudflare, then delete + re-add the custom domain
to force a fresh validation (it then went `active` within ~30s). If you ever
recreate the redirect rules AND need a new R2 cert at the same time, keep the
`/.well-known/` exclusion in place until the cert is `active`.

## Rollback procedure (if R2 delivery misbehaves after cutover)

1. In R2 → bucket `reversim` → Settings → Custom Domains: **remove**
   `m2.reversim.com` (and `m.reversim.com` if added).
2. Re-create the two wildcard Single Redirects documented above:
   `http*://m2.reversim.com/*` and `http*://m.reversim.com/*`
   → Target `https://reversim.s3.amazonaws.com/${2}`, status `302`.
3. Ensure `m.`/`m2.` DNS records exist and are **proxied** (orange cloud).
4. Verify: `curl -sI https://m2.reversim.com/reversim458-MAX.mp3` returns
   `302` with `location: https://reversim.s3.amazonaws.com/...`.
5. The S3 bucket `reversim` is the durable origin — keep it intact until R2
   delivery has run cleanly for at least a billing cycle before deleting.
