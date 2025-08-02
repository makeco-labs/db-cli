/**
 * Normalizes SQLite URL for different drivers
 */
export const normalizeSQLiteUrl = (
	url: string,
	type: 'libsql' | 'better-sqlite',
): string => {
	if (type === 'libsql') {
		if (url.startsWith('file:')) {
			return url;
		}
		try {
			const parsedUrl = new URL(url);
			if (parsedUrl.protocol === null) {
				return `file:${url}`;
			}
			return url;
		} catch {
			return `file:${url}`;
		}
	}

	if (type === 'better-sqlite') {
		if (url.startsWith('file:')) {
			return url.substring(5);
		}
		return url;
	}

	throw new Error(`Unknown SQLite driver type: ${type}`);
};