import { put, del, head } from '@vercel/blob';
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

export async function deleteDocument(employeeId: string): Promise<boolean> {
	try {
		await del(blobPath(employeeId), { token: BLOB_READ_WRITE_TOKEN });
		return true;
	} catch {
		return false;
	}
}
