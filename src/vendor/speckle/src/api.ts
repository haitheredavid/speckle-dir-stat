/**
 * API
 * @Private
 */

export default class API {
	static async query(
		server: string,
		token: string | undefined,
		query: string,
		variables: object = {}
	) {
		const headers: any = {
			'Content-Type': 'application/json',
		};

		if (token) {
			headers['Authorization'] = 'Bearer ' + token;
		}

		const res = await fetch(`${server}/graphql`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				query,
				variables,
			}),
		});

		if (!res) {
			throw new Error('error with fetch');
		}

		return await res.json();
	}
}
