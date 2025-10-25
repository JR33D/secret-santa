// API helper functions with proper error handling

export async function apiGet<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	return response.json();
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: data ? JSON.stringify(data) : undefined,
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	return response.json();
}

export async function apiDelete(url: string): Promise<any> {
	const response = await fetch(url, {
		method: 'DELETE',
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	return response.json();
}

export async function apiPatch<T>(url: string, data: any): Promise<T> {
	const response = await fetch(url, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}
	return response.json();
}
