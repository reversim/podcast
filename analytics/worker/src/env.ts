export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  MEDIA_HOSTS: string;
  FEED_HOSTS: string;
  STATS_HOST: string;
  SITE_ORIGINS?: string; // comma list of origins allowed to send beacons
  FEED_ORIGIN: string;
  FEED_MODE?: string;
  ORIGIN_MODE: string;
  MIN_BYTES: string;
  DEV?: string;
  HASH_SALT?: string;
  DASH_TOKEN?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}
