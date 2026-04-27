declare global {
	namespace App {
		interface Locals {
			user: { nip: string; nama: string } | null;
			isAdmin: boolean;
		}
		interface PageData {
			user: { nip: string; nama: string } | null;
			isAdmin: boolean;
		}
	}
}

export {};
