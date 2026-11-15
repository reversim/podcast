// Rehype plugin for the old Blogger posts: gives a name to images and iframes that have none.
// Screen readers then announce them, and a link that holds only an image gets a name too.
// The names are generic (from the post title), because the old posts have no image descriptions.

function iframeTitle(src) {
	if (/youtube(-nocookie)?\.com|youtu\.be/.test(src)) return 'סרטון YouTube';
	if (/slideshare\.net|docs\.google\.com\/presentation|speakerdeck\.com/.test(src)) return 'מצגת';
	if (/vimeo\.com/.test(src)) return 'סרטון Vimeo';
	return 'תוכן מוטמע';
}

const attr = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The same change on an HTML string. Astro gives the plugin raw HTML as strings, because it parses them later. */
export function nameMediaHtml(html, postTitle) {
	const alt = attr(postTitle ? `תמונה מתוך: ${postTitle}` : 'תמונה');
	return html
		// A link with an address and no content is invisible, but the keyboard stops on it. Remove it. Keep named anchors.
		.replace(/<a\b(?=[^>]*\shref\s*=)(?![^>]*\s(?:name|id)\s*=)[^>]*>((?:\s|&nbsp;|<br\s*\/?>|<(b|i|u|span)\b[^>]*>\s*<\/\2>)*)<\/a>/gi, '$1')
		// An image that is the only content of a link gives the link its name, so an empty alt is not enough there.
		.replace(/(<a\b[^>]*\shref\s*=[^>]*>\s*<img\b[^>]*?\salt\s*=\s*)(?:""|'')([^>]*>\s*<\/a>)/gi, (_, before, after) => `${before}"${alt}"${after}`)
		.replace(/<img\b(?![^>]*\salt\s*=)([^>]*?)(\s*\/?>)/gi, (_, rest, end) => `<img${rest} alt="${alt}"${end}`)
		.replace(/<iframe\b(?![^>]*\stitle\s*=)([^>]*)>/gi, (_, rest) => `<iframe${rest} title="${attr(iframeTitle(rest))}">`);
}

/** Adds `alt` to <img> and `title` to <iframe> where they are absent. Changes the tree in place. */
export function nameMedia(node, postTitle) {
	if (node.type === 'element') {
		const props = (node.properties ??= {});
		if (node.tagName === 'img' && props.alt === undefined) {
			props.alt = postTitle ? `תמונה מתוך: ${postTitle}` : 'תמונה';
		}
		if (node.tagName === 'iframe' && !props.title) {
			props.title = iframeTitle(String(props.src ?? ''));
		}
	}
	if (node.type === 'raw' && typeof node.value === 'string') node.value = nameMediaHtml(node.value, postTitle);
	if (node.children) {
		fixLinks(node.children, postTitle);
		fixRawInlineLinks(node.children, postTitle);
	}
	for (const child of node.children ?? []) nameMedia(child, postTitle);
}

const isBlankNode = (n) =>
	(n.type === 'text' && !n.value.replace(/\u00a0/g, ' ').trim()) ||
	(n.type === 'element' && (n.tagName === 'br' || (['b', 'i', 'u', 'span', 'font'].includes(n.tagName) && (n.children ?? []).every(isBlankNode))));

// Removes links with an address and no content (the keyboard stops on them, and they have no name), and keeps their
// blank content. Names a link whose only content is an image with an empty alt. Named anchors stay.
function fixLinks(children, postTitle) {
	for (let i = 0; i < children.length; i++) {
		const link = children[i];
		if (link.type !== 'element' || link.tagName !== 'a') continue;
		const props = link.properties ?? {};
		if (props.href === undefined || props.name !== undefined || props.id !== undefined) continue;
		const content = (link.children ?? []).filter((n) => !isBlankNode(n));
		if (content.length === 0) {
			children.splice(i, 1, ...(link.children ?? []));
			i += (link.children ?? []).length - 1;
		} else if (content.length === 1 && content[0].type === 'element' && content[0].tagName === 'img' && !content[0].properties?.alt) {
			(content[0].properties ??= {}).alt = postTitle ? `תמונה מתוך: ${postTitle}` : 'תמונה';
		}
	}
}

const rawTag = (n, pattern) => n?.type === 'raw' && pattern.test(n.value.trim());
const RAW_OPEN_LINK = /^<a\b(?=[^>]*\shref\s*=)(?![^>]*\s(?:name|id)\s*=)[^>]*>$/i;

// The same as fixLinks for inline HTML that is not parsed yet: one raw node for "<a href>", then the content, then "</a>".
function fixRawInlineLinks(children, postTitle) {
	const skipBlank = (from) => {
		let at = from;
		while (at < children.length && (isBlankNode(children[at]) || rawTag(children[at], /^<br\s*\/?>$/i))) at++;
		return at;
	};
	for (let i = 0; i < children.length; i++) {
		if (!rawTag(children[i], RAW_OPEN_LINK)) continue;
		const j = skipBlank(i + 1);
		if (rawTag(children[j], /^<\/a>$/i)) {
			const kept = children.slice(i + 1, j);
			children.splice(i, j - i + 1, ...kept);
			i += kept.length - 1;
		} else if (rawTag(children[j], /^<img\b[^>]*>$/i) && rawTag(children[skipBlank(j + 1)], /^<\/a>$/i)) {
			const alt = attr(postTitle ? `תמונה מתוך: ${postTitle}` : 'תמונה');
			children[j].value = children[j].value.replace(/\salt\s*=\s*(?:""|'')/i, ` alt="${alt}"`);
		}
	}
}

export default function rehypeA11y() {
	return (tree, file) => nameMedia(tree, file?.data?.astro?.frontmatter?.title);
}
