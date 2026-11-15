// Square episode art for the podcast apps: the hero image of the episode on a card, over a blurred copy of it,
// with the podcast logo as a watermark and the episode number. Made at build time (see pages/episode-art).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const ART_SIZE = 1400; // Apple and Spotify want a square of 1400 to 3000 px.
const PUBLIC = join(process.cwd(), 'public');
const LOGO = join(PUBLIC, 'podcast-cover.png');

/** The file of a cover image, or undefined when the image is remote or absent. */
export function localCoverFile(cover: string | undefined): string | undefined {
	if (!cover || /^(https?:)?\/\//.test(cover)) return undefined;
	const file = join(PUBLIC, decodeURIComponent(cover.split('?')[0]));
	return existsSync(file) ? file : undefined;
}

const roundedMask = (w: number, h: number, r: number) =>
	Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`);

let logoCache: Promise<Buffer> | undefined;
function logo(size: number): Promise<Buffer> {
	logoCache ??= sharp(LOGO)
		.resize(size, size)
		.composite([{ input: roundedMask(size, size, 36), blend: 'dest-in' }])
		.png()
		.toBuffer();
	return logoCache;
}

export async function episodeArt(coverFile: string, episode?: number): Promise<Buffer> {
	const S = ART_SIZE;
	const card = { x: 70, y: 70, w: S - 140, h: 960, pad: 56 };
	const hero = sharp(coverFile, { density: 300 }).flatten({ background: '#ffffff' });

	// Background: the image made very small and then large again. This gives a soft field of its colours.
	// Two steps, because one sharp pipeline keeps only its last resize.
	const tiny = await hero.clone().resize(6, 6, { fit: 'cover' }).png().toBuffer();
	const background = await sharp(tiny).resize(S, S, { kernel: 'cubic' }).modulate({ brightness: 0.6, saturation: 1.2 }).toBuffer();

	const inner = await hero
		.clone()
		.resize(card.w - 2 * card.pad, card.h - 2 * card.pad, { fit: 'inside' })
		.png()
		.toBuffer({ resolveWithObject: true });

	const cardSvg = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
			<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="48" fill="#ffffff"/>
			${episode ? `<text x="90" y="1290" font-family="Helvetica, Arial, DejaVu Sans, sans-serif" font-weight="700" font-size="230" fill="#ffffff">${episode}</text>` : ''}
		</svg>`,
	);
	const logoSize = 250;
	return sharp(background)
		.composite([
			{ input: cardSvg, left: 0, top: 0 },
			{
				input: inner.data,
				left: Math.round(card.x + (card.w - inner.info.width) / 2),
				top: Math.round(card.y + (card.h - inner.info.height) / 2),
			},
			{ input: await logo(logoSize), left: S - logoSize - 70, top: S - logoSize - 70 },
		])
		.jpeg({ quality: 82, mozjpeg: true })
		.toBuffer();
}

export const THUMB_WIDTH = 640; // Cards are about 320 px wide. This is enough for screens with double density.

/** True when the cover image can get a small WebP copy (a local raster image). */
export function hasThumb(cover: string | undefined): boolean {
	const file = localCoverFile(cover);
	return !!file && !/\.svg$/i.test(file);
}

/** The address to show for a cover image in a list: the small copy when there is one, else the image. */
export function coverThumbUrl(postId: string, cover: string | undefined): string | undefined {
	return hasThumb(cover) ? `/thumbs/${postId}.webp` : cover;
}

/** A small WebP copy of a cover image. Never larger than the source. */
export function coverThumb(coverFile: string): Promise<Buffer> {
	return sharp(coverFile).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
}
