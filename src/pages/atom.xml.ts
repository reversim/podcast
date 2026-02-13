import { getAllPosts, getPostPermalink } from '../lib/posts';

const escapeXml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');

const toRfc3339 = (date: Date) => date.toISOString();

export async function GET() {
	const posts = await getAllPosts();
	const site = import.meta.env.SITE;
	const feedUrl = new URL('/atom.xml', site).toString();
	const siteUrl = new URL('/', site).toString();
	const updated = posts[0]?.data.date ?? new Date();

	const entries = posts
		.map((post) => {
			const link = new URL(getPostPermalink(post), site).toString();
			const title = escapeXml(post.data.title);
			const summary = escapeXml(post.data.summary ?? '');
			const published = toRfc3339(post.data.date);
			const content = `<![CDATA[${post.body ?? ''}]]>`;
			return `<entry>
  <title>${title}</title>
  <id>${escapeXml(link)}</id>
  <link href="${escapeXml(link)}" />
  <updated>${published}</updated>
  <published>${published}</published>
  <summary>${summary}</summary>
  <content type="html">${content}</content>
</entry>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="he">
  <title>רברס עם פלטפורמה</title>
  <subtitle>פודקאסט על תוכנה, מוצר, ותשתיות — בעברית.</subtitle>
  <id>${escapeXml(feedUrl)}</id>
  <link rel="self" href="${escapeXml(feedUrl)}" />
  <link href="${escapeXml(siteUrl)}" />
  <updated>${toRfc3339(updated)}</updated>
  <author>
    <name>רברס עם פלטפורמה</name>
  </author>
${entries}
</feed>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/atom+xml; charset=utf-8',
		},
	});
}
