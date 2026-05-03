import { put, del, head, list } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';

const PREFIX = 'documents';

function blobPath(employeeId: string): string {
	return `${PREFIX}/${employeeId}.pdf`;
}

export async function hasDocument(employeeId: string): Promise<boolean> {
	try {
		const info = await head(blobPath(employeeId), { token: BLOB_READ_WRITE_TOKEN });
		return !!info;
	} catch {
		return false;
	}
}

export async function saveDocument(employeeId: string, buffer: Buffer): Promise<string> {
	const result = await put(blobPath(employeeId), buffer, {
		access: 'private',
		contentType: 'application/pdf',
		addRandomSuffix: false,
		token: BLOB_READ_WRITE_TOKEN
	});
	return result.url;
}

export async function readDocument(employeeId: string): Promise<Buffer | null> {
	try {
		const info = await head(blobPath(employeeId), { token: BLOB_READ_WRITE_TOKEN });
		// Private blobs require the token in the Authorization header
		const res = await fetch(info.url, {
			headers: { Authorization: `Bearer ${BLOB_READ_WRITE_TOKEN}` }
		});
		if (!res.ok) return null;
		return Buffer.from(await res.arrayBuffer());
	} catch {
		return null;
	}
}

/** Returns a Set of employee IDs that currently have a document in Vercel Blob. */
export async function listDocumentIds(): Promise<Set<string>> {
	const ids = new Set<string>();
	let cursor: string | undefined;
	do {
		const result = await list({ prefix: `${PREFIX}/`, token: BLOB_READ_WRITE_TOKEN, cursor, limit: 1000 });
		for (const blob of result.blobs) {
			// pathname is like "documents/{uuid}.pdf"
			const filename = blob.pathname.slice(PREFIX.length + 1); // "{uuid}.pdf"
			const id = filename.replace(/\.pdf$/i, '');
			if (id) ids.add(id);
		}
		cursor = result.cursor;
	} while (cursor);
	return ids;
}

export async function deleteDocument(employeeId: string): Promise<boolean> {
	try {
		await del(blobPath(employeeId), { token: BLOB_READ_WRITE_TOKEN });
		return true;
	} catch {
		return false;
	}
}
