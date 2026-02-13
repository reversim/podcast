const base = import.meta.env.BASE_URL ?? '/';

export function withBase(path: string) {
	if (!path) return base;
	if (base === '/' || base === '') {
		return path.startsWith('/') ? path : `/${path}`;
	}
	const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${normalizedBase}${normalizedPath}`;
}
