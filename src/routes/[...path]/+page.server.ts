import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { VERCEL_URL } from '$env/static/private';
import type { Article } from 'src/article';

export const load = (async ({ params, fetch }) => {
	try {
		const reqUrl = new URL(
			'/api/artist/comments',
			VERCEL_URL ? `https://${VERCEL_URL}` : 'http://localhost:3000'
		);
		reqUrl.searchParams.set('path', params.path);
		const request = await fetch(reqUrl.toString());
		const response = await request.json();

		return {
			artistComments: response.artistComments as Article[]
		};
	} catch (err) {
		console.log(err);
		throw error(500, 'Internal Server Error');
	}
}) satisfies PageServerLoad;
