import type { PageServerLoad } from './$types';
import { getEmployees } from '$lib/server/db';
import { computeStats } from '$lib/utils/analytics';

export const load: PageServerLoad = async () => {
	const employees = getEmployees({ activeOnly: true });
	const stats = computeStats(employees);
	return { employees, stats };
};
