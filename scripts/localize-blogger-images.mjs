import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pLimit from 'p-limit';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'src/content/posts');
const IMAGES_DIR = path.join(ROOT, 'public/images/blogger');
const CONCURRENCY = 8;
const RETRIES = 3;
const FETCH_TIMEOUT_MS = 15000;
const WAYBACK_API = 'https://archive.org/wayback/available';

const BLOGGER_URL_RE =
	/https?:\/\/(?:blogger\.googleusercontent\.com|lh3\.googleusercontent\.com\/blogger_img_proxy)[^\s'")<>\]]+/g;

const EXT_BY_MIME = {
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'image/bmp': 'bmp',
	'image/avif': 'avif',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extensionFromUrl(url) {
	const m = url.match(/\.(png|jpe?g|gif|webp|svg|bmp|avif)(?:$|[?#])/i);
	return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : null;
}

function extensionFromContentType(contentType) {
	if (!contentType) return null;
	const mime = contentType.split(';')[0].trim().toLowerCase();
	return EXT_BY_MIME[mime] ?? null;
}

function sha(url) {
	return crypto.createHash('sha1').update(url).digest('hex').slice(0, 20);
}

function candidateUrls(url) {
	const out = [url];
	const resizedNoH = url.replace(/\/s(\d+)-h\//, '/s$1/');
	if (resizedNoH !== url) out.push(resizedNoH);
	return [...new Set(out)];
}

async function fetchWithRetry(url, attempt = 1) {
	try {
		const res = await fetch(url, {
			headers: { 'user-agent': 'reversim-image-migrator/1.0' },
			redirect: 'follow',
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		return res;
	} catch (error) {
		if (attempt >= RETRIES) throw error;
		await sleep(400 * attempt * attempt);
		return fetchWithRetry(url, attempt + 1);
	}
}

async function findWaybackSnapshot(url) {
	try {
		const api = `${WAYBACK_API}?url=${encodeURIComponent(url)}`;
		const res = await fetch(api, {
			headers: { 'user-agent': 'reversim-image-migrator/1.0' },
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		if (!res.ok) return null;
		const data = await res.json();
		const closest = data?.archived_snapshots?.closest;
		if (closest?.available && closest?.url) return closest.url;
		return null;
	} catch {
		return null;
	}
}

async function listPostFiles() {
	const names = await fs.readdir(POSTS_DIR);
	return names.filter((name) => name.endsWith('.md')).map((name) => path.join(POSTS_DIR, name));
}

async function collectUrls(files) {
	const set = new Set();
	for (const file of files) {
		const text = await fs.readFile(file, 'utf8');
		const matches = text.match(BLOGGER_URL_RE) ?? [];
		for (const url of matches) set.add(url);
	}
	return [...set];
}

async function downloadAll(urls) {
	await fs.mkdir(IMAGES_DIR, { recursive: true });
	const limit = pLimit(CONCURRENCY);
	const mapping = new Map();
	const failures = [];

	await Promise.all(
		urls.map((url) =>
			limit(async () => {
				const hash = sha(url);
				try {
					let saved = false;
					let lastError = 'download failed';
					for (const candidate of candidateUrls(url)) {
						try {
							const res = await fetchWithRetry(candidate);
							const contentType = res.headers.get('content-type') ?? '';
							const mime = contentType.split(';')[0].trim().toLowerCase();
							if (!mime.startsWith('image/')) {
								lastError = `non-image content-type: ${contentType || 'unknown'}`;
								continue;
							}
							const ext =
								extensionFromUrl(candidate) ?? extensionFromContentType(contentType) ?? 'jpg';
							const filename = `${hash}.${ext}`;
							const diskPath = path.join(IMAGES_DIR, filename);
							const localPath = `/images/blogger/${filename}`;
							const bytes = Buffer.from(await res.arrayBuffer());
							await fs.writeFile(diskPath, bytes);
							mapping.set(url, localPath);
							saved = true;
							process.stdout.write('.');
							break;
						} catch (candidateError) {
							lastError = candidateError.message;
						}
					}
					if (!saved) {
						const snapshot = await findWaybackSnapshot(url);
						if (snapshot) {
							try {
								const res = await fetchWithRetry(snapshot);
								const contentType = res.headers.get('content-type') ?? '';
								const mime = contentType.split(';')[0].trim().toLowerCase();
								if (mime.startsWith('image/')) {
									const ext =
										extensionFromUrl(url) ?? extensionFromContentType(contentType) ?? 'jpg';
									const filename = `${hash}.${ext}`;
									const diskPath = path.join(IMAGES_DIR, filename);
									const localPath = `/images/blogger/${filename}`;
									const bytes = Buffer.from(await res.arrayBuffer());
									await fs.writeFile(diskPath, bytes);
									mapping.set(url, localPath);
									saved = true;
									process.stdout.write('W');
								} else {
									lastError = `wayback non-image content-type: ${contentType || 'unknown'}`;
								}
							} catch (waybackError) {
								lastError = `wayback fetch failed: ${waybackError.message}`;
							}
						}
					}
					if (!saved) throw new Error(lastError);
				} catch (error) {
					failures.push({ url, error: error.message });
					process.stdout.write('E');
				}
			})
		)
	);
	process.stdout.write('\n');

	return { mapping, failures };
}

function replaceUrls(text, mapping) {
	let updated = text;
	for (const [remote, local] of mapping.entries()) {
		if (updated.includes(remote)) {
			updated = updated.split(remote).join(local);
		}
	}
	return updated;
}

function injectCoverImageIfMissing(text) {
	if (!text.startsWith('---\n')) return text;
	const end = text.indexOf('\n---\n', 4);
	if (end < 0) return text;

	const frontmatter = text.slice(4, end);
	if (/^cover_image:/m.test(frontmatter)) return text;

	const body = text.slice(end + 5);
	const firstLocalImage = body.match(/\/images\/blogger\/[^\s'")<>\]]+/)?.[0];
	if (!firstLocalImage) return text;

	const newFrontmatter = `${frontmatter}\ncover_image: ${firstLocalImage}`;
	return `---\n${newFrontmatter}\n---\n${body}`;
}

async function rewritePosts(files, mapping) {
	let changed = 0;
	for (const file of files) {
		const original = await fs.readFile(file, 'utf8');
		let updated = replaceUrls(original, mapping);
		updated = injectCoverImageIfMissing(updated);
		if (updated !== original) {
			await fs.writeFile(file, updated);
			changed += 1;
		}
	}
	return changed;
}

async function main() {
	const files = await listPostFiles();
	const urls = await collectUrls(files);
	console.log(`Found ${urls.length} unique Blogger-hosted URLs across ${files.length} posts.`);

	const { mapping, failures } = await downloadAll(urls);
	const changedPosts = await rewritePosts(files, mapping);

	console.log(`Downloaded: ${mapping.size}`);
	console.log(`Failed: ${failures.length}`);
	console.log(`Posts updated: ${changedPosts}`);

	if (failures.length > 0) {
		const failuresPath = path.join(ROOT, 'scripts', 'localize-blogger-images.failures.json');
		await fs.writeFile(failuresPath, JSON.stringify(failures, null, 2));
		console.log(`Failures report: ${failuresPath}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
