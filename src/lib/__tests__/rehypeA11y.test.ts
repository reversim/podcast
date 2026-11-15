import { describe, it, expect } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { nameMedia, nameMediaHtml } from '../rehypeA11y.mjs';

const el = (tagName: string, properties: Record<string, unknown> = {}, children: unknown[] = []) => ({ type: 'element', tagName, properties, children });

describe('rehypeA11y', () => {
	it('adds alt to images without one and keeps an existing alt, also an empty one', () => {
		const tree = { type: 'root', children: [el('a', {}, [el('img', { src: 'a.png' })]), el('img', { alt: 'logo' }), el('img', { alt: '' })] };
		nameMedia(tree, '177 Bumpers 5');
		const imgs = [(tree.children[0] as any).children[0], tree.children[1], tree.children[2]] as any[];
		expect(imgs.map((i) => i.properties.alt)).toEqual(['תמונה מתוך: 177 Bumpers 5', 'logo', '']);
	});
	it('adds a title to iframes by the kind of embed', () => {
		const tree = { type: 'root', children: [el('iframe', { src: '//www.youtube.com/embed/x' }), el('iframe', { src: 'https://x.y/z' }), el('iframe', { src: 'q', title: 'mine' })] };
		nameMedia(tree, undefined);
		expect((tree.children as any[]).map((i) => i.properties.title)).toEqual(['סרטון YouTube', 'תוכן מוטמע', 'mine']);
	});
	it('names images and iframes in raw HTML strings', () => {
		const html = '<a href="x"><img border="0" src="a.png"></a><img alt="" src="b.png" /><img src="c.png"/><iframe src="//www.youtube.com/embed/x" width="5"></iframe><iframe title="t" src="y"></iframe>';
		expect(nameMediaHtml(html, 'A "B" <C>')).toBe(
			'<a href="x"><img border="0" src="a.png" alt="תמונה מתוך: A &quot;B&quot; &lt;C>"></a><img alt="" src="b.png" /><img src="c.png" alt="תמונה מתוך: A &quot;B&quot; &lt;C>"/><iframe src="//www.youtube.com/embed/x" width="5" title="סרטון YouTube"></iframe><iframe title="t" src="y"></iframe>',
		);
		expect(nameMediaHtml('x<a class="attrlink" href="https://a.b/"></a>y<a href="u"><b> </b></a><a name="top"></a><a href="u">text</a>', 'T')).toBe('xy<b> </b><a name="top"></a><a href="u">text</a>');
		expect(nameMediaHtml('<a href="/i.png"><img alt="" border="0" src="/i.png"></a><img alt="" src="d.png">', 'T')).toBe('<a href="/i.png"><img alt="תמונה מתוך: T" border="0" src="/i.png"></a><img alt="" src="d.png">');
		const tree = { type: 'root', children: [{ type: 'raw', value: '<img src="a.png">' }] };
		nameMedia(tree, 'T');
		expect((tree.children[0] as any).value).toBe('<img src="a.png" alt="תמונה מתוך: T">');
	});
	it('removes links with no content and names links that hold only an image', () => {
		const text = (value: string) => ({ type: 'text', value });
		const tree = { type: 'root', children: [
			el('a', { href: 'u', className: ['attrlink'] }, [text(' ')]),
			el('a', { href: 'u' }, [el('b', {}, [text(' ')])]),
			el('a', { href: 'i.png' }, [el('img', { alt: '', src: 'i.png' })]),
			el('a', { name: 'top' }),
			el('a', { href: 'u' }, [text('keep')]),
		] };
		nameMedia(tree, 'T');
		const kids = tree.children as any[];
		expect(kids.map((c) => c.tagName ?? c.value)).toEqual([' ', 'b', 'a', 'a', 'a']);
		expect(kids[2].children[0].properties.alt).toBe('תמונה מתוך: T');
		expect(kids[3].properties.name).toBe('top');
	});
	it('does the same for inline HTML that arrives as one raw node for each tag', () => {
		const raw = (value: string) => ({ type: 'raw', value });
		const text = (value: string) => ({ type: 'text', value });
		const tree = { type: 'root', children: [raw('<a href="u">'), text(' '), raw('</a>'), text('x'), raw('<a href="i.png">'), raw('<img alt="" src="i.png">'), raw('</a>'), raw('<a name="n">'), raw('</a>'), raw('<a href="u">'), text('keep'), raw('</a>')] };
		nameMedia(tree, 'T');
		expect((tree.children as any[]).map((c) => c.value)).toEqual([' ', 'x', '<a href="i.png">', '<img alt="תמונה מתוך: T" src="i.png">', '</a>', '<a name="n">', '</a>', '<a href="u">', 'keep', '</a>']);
	});
});
