export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export function getStoredToken() {
	return localStorage.getItem('supportbee_token');
}

export function getStoredCompany() {
	const raw = localStorage.getItem('supportbee_company');
	if (!raw) return null;

	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function storeSession({ token, company }) {
	localStorage.setItem('supportbee_token', token);
	localStorage.setItem('supportbee_company', JSON.stringify(company));
}

export function clearSession() {
	localStorage.removeItem('supportbee_token');
	localStorage.removeItem('supportbee_company');
}

export async function requestJson(path, options = {}) {
	const headers = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	const token = getStoredToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers,
	});

	const contentType = response.headers.get('content-type') || '';
	const payload = contentType.includes('application/json') ? await response.json() : await response.text();

	if (!response.ok) {
		throw new Error(payload?.message || payload || 'Request failed');
	}

	return payload;
}

export async function requestFormData(path, formData, options = {}) {
	const headers = {
		...(options.headers || {}),
	};

	const token = getStoredToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: options.method || 'POST',
		...options,
		headers,
		body: formData,
	});

	const contentType = response.headers.get('content-type') || '';
	const payload = contentType.includes('application/json') ? await response.json() : await response.text();

	if (!response.ok) {
		throw new Error(payload?.message || payload || 'Request failed');
	}

	return payload;
}
