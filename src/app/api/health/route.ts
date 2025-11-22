import { getDb } from '@/lib/db';

export async function GET() {
	try {
		// Check database connectivity
		const db = await getDb();
		await db.get('SELECT 1');

		return Response.json(
			{
				status: 'healthy',
				timestamp: new Date().toISOString(),
				database: 'connected',
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		// debug - ensure the fallback path returns what we expect
		const resp = Response.json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				database: 'disconnected',
				error: error instanceof Error ? error.message : 'An unknown error occurred',
			},
			{ status: 503 },
		);
		return resp;
	}
}
