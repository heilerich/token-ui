/** Tiny DOM helpers — keep the app code declarative without a framework. */

/** Escape a string for safe interpolation into innerHTML. */
export function esc(value: unknown): string {
	return String(value == null ? '' : value).replace(
		/[&<>"]/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string
	);
}

/** `querySelector` that throws if the element is missing — fail loud, not silent. */
export function must<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
	const el = root.querySelector<T>(selector);
	if (!el) throw new Error(`Expected element not found: ${selector}`);
	return el;
}

/** `querySelector` that returns null (typed) when the element may be absent. */
export function maybe<T extends Element = HTMLElement>(
	selector: string,
	root: ParentNode = document
): T | null {
	return root.querySelector<T>(selector);
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function isExpired(iso: string): boolean {
	return new Date(iso) < new Date();
}
