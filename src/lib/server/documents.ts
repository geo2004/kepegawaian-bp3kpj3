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
		// downloadUrl includes a short-lived signed token valid for private blobs
		const res = await fetch(info.downloadUrl);
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
