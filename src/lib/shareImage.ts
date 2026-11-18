// Large share image (1200 x 630) for links to an episode on X, LinkedIn, Facebook and WhatsApp.
// The cover of the episode on a card, over a blurred copy of it, with the podcast logo and the episode number.
// An episode with no local cover gets the podcast logo on the brand colour. Made at build time (see pages/share).
import { join } from 'node:path';
import sharp from 'sharp';

export const SHARE_WIDTH = 1200;
export const SHARE_HEIGHT = 630;
const LOGO = join(process.cwd(), 'public', 'podcast-cover.png');
const FONT = 'Helvetica, Arial, DejaVu Sans, sans-serif';

const rounded = (w: number, h: number, r: number) =>
	Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`);

const logoCache = new Map<number, Promise<Buffer>>();
function logo(size: number): Promise<Buffer> {
	if (!logoCache.has(size)) {
		logoCache.set(
			size,
			sharp(LOGO).resize(size, size).composite([{ input: rounded(size, size, Math.round(size * 0.14)), blend: 'dest-in' }]).png().toBuffer(),
		);
	}
	return logoCache.get(size) as Promise<Buffer>;
}

/** The address of the share image of a post. */
export function shareImageUrl(postId: string): string {
	return `/share/${postId}.jpg`;
}

export async function shareImage(coverFile: string | undefined, episode?: number): Promise<Buffer> {
	const W = SHARE_WIDTH;
	const H = SHARE_HEIGHT;
	const side = { x: 890, w: 270 }; // column for the logo and the episode number
	const number = episode
		? `<text x="${side.x + side.w / 2}" y="${H - 70}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="120" fill="#ffffff">${episode}</text>`
		: '';

	if (!coverFile) {
		const svg = Buffer.from(
			`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
				<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2a41"/><stop offset="1" stop-color="#0c1320"/></linearGradient></defs>
				<rect width="${W}" height="${H}" fill="url(#g)"/>${number}
			</svg>`,
		);
		const size = 470;
		return sharp(svg)
			.composite([{ input: await logo(size), left: Math.round((side.x - size) / 2 + 20), top: Math.round((H - size) / 2) }])
			.jpeg({ quality: 84, mozjpeg: true })
			.toBuffer();
	}

	const card = { x: 40, y: 40, w: 810, h: H - 80, pad: 36 };
	const hero = sharp(coverFile, { density: 300 }).flatten({ background: '#ffffff' });
	// Background: the image made very small and then large again. Two steps, because one sharp pipeline keeps only its last resize.
	const tiny = await hero.clone().resize(6, 4, { fit: 'cover' }).png().toBuffer();
	const background = await sharp(tiny).resize(W, H, { kernel: 'cubic', fit: 'fill' }).modulate({ brightness: 0.55, saturation: 1.2 }).toBuffer();
	const inner = await hero
		.clone()
		.resize(card.w - 2 * card.pad, card.h - 2 * card.pad, { fit: 'inside' })
		.png()
		.toBuffer({ resolveWithObject: true });
	const overlay = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
			<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="36" fill="#ffffff"/>${number}
		</svg>`,
	);
	const logoSize = 250;
	return sharp(background)
		.composite([
			{ input: overlay, left: 0, top: 0 },
			{
				input: inner.data,
				left: Math.round(card.x + (card.w - inner.info.width) / 2),
				top: Math.round(card.y + (card.h - inner.info.height) / 2),
			},
			{ input: await logo(logoSize), left: Math.round(side.x + (side.w - logoSize) / 2), top: card.y + 20 },
		])
		.jpeg({ quality: 84, mozjpeg: true })
		.toBuffer();
}
