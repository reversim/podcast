// Post-build: make the legacy Blogger archive URLs resolve on GitHub Pages.
// Astro (build.format: 'file') writes dist/YYYY.html and dist/YYYY/MM.html.
// Blogger used /YYYY/, /YYYY/MM/ and /YYYY_MM_01_archive.html, so copy the pages there.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
let count = 0;
const copy = (from, to) => {
	copyFileSync(from, to);
	count++;
};

for (const entry of readdirSync(dist)) {
	const year = entry.match(/^(\d{4})\.html$/)?.[1];
	if (!year || !existsSync(join(dist, year))) continue;
	copy(join(dist, entry), join(dist, year, 'index.html'));
	for (const file of readdirSync(join(dist, year))) {
		const month = file.match(/^(\d{2})\.html$/)?.[1];
		if (!month) continue;
		const src = join(dist, year, file);
		mkdirSync(join(dist, year, month), { recursive: true });
		copy(src, join(dist, year, month, 'index.html'));
		copy(src, join(dist, `${year}_${month}_01_archive.html`));
	}
}
console.log(`legacy-archive-dirs: wrote ${count} files`);
