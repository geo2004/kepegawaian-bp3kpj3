import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(process.cwd(), 'data', 'documents');

function ensureDir() {
	if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });
}

function filePath(employeeId: string): string {
	return join(DOCS_DIR, `${employeeId}.pdf`);
}

export function hasDocument(employeeId: string): boolean {
	return existsSync(filePath(employeeId));
}

export function saveDocument(employeeId: string, buffer: Buffer): void {
	ensureDir();
	writeFileSync(filePath(employeeId), buffer);
}

export function readDocument(employeeId: string): Buffer | null {
	const p = filePath(employeeId);
	if (!existsSync(p)) return null;
	return readFileSync(p);
}

export function deleteDocument(employeeId: string): boolean {
	const p = filePath(employeeId);
	if (!existsSync(p)) return false;
	unlinkSync(p);
	return true;
}
