import { error } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

import type { PageServerLoad } from './$types';

import { WEV_EMAIL, WEV_PASSWORD, WEV_APP_SECRET } from '$env/static/private';
import type artistComments from '$lib/data/artistComments.json';
import { BrowserSettings } from '$lib/server/browser-settings';
import { WeverseArtistPostHelper } from '$lib/server/weverse-artist-post-helper';

function flattenArtistComments(comments: (typeof artistComments)['data']) {
	const flattened: Article[] = [];

	comments.forEach((comment) => {
		const {
			commentId: id,
			body,
			author: { profileName, profileImageUrl },
			createdAt
		} = comment;
		const parent = comment.parent;
		const parentId = (
			parent.type === 'POST' ? parent.data.postId : parent.data.commentId
		) as string;

		const article = { id, body, createdAt, profileName, profileImageUrl, parentId, children: [] };
		const articleIdx = flattened.findIndex((article) => article.id === id);
		if (articleIdx > -1) {
			flattened[articleIdx] = article;
		} else {
			flattened.push(article);
		}

		const parentArticle = flattened.find((article) => article.id === parentId);
		if (!parentArticle) {
			flattened.push({
				id: parentId,
				body: parent.data.plainBody || parent.data.body,
				profileName: parent.data.author.profileName,
				profileImageUrl: parent.data.author.profileImageUrl,
				children: []
			});
		}
	});

	for (const id in flattened) {
		const article = flattened[id];

		if (article.parentId) {
			const parentIdx = flattened.findIndex(
				(parentArticle) => parentArticle.id === article.parentId
			);
			if (parentIdx > -1) {
				flattened[parentIdx].children.push(article);
				flattened[parentIdx].children.sort((a, b) => {
					if (typeof a.createdAt === 'undefined' || typeof b.createdAt === 'undefined') return 0;
					return a.createdAt - b.createdAt;
				});
			}
		}
	}

	return flattened;
}

async function authenticate() {
	const headers = new Headers({
		'Content-Type': 'application/json',
		'x-acc-app-secret': WEV_APP_SECRET,
		'x-acc-app-version': '2.2.4',
		'x-acc-language': 'ko',
		'x-acc-service-id': 'weverse',
		'x-acc-trace-id': uuidv4(),
		'x-clog-user-device-id': uuidv4()
	});

	const response = await fetch(
		'https://accountapi.weverse.io/web/api/v2/auth/token/by-credentials',
		{
			method: 'POST',
			body: JSON.stringify({
				email: WEV_EMAIL,
				password: WEV_PASSWORD
			}),
			headers
		}
	);

	return response.json();
}

async function getUrlWithAuth(path: string) {
	const loginAfter = new URL('https://weverse.io/loginResult');
	loginAfter.searchParams.set('topath', `/${path}`);

	const token = await authenticate();
	Object.entries(token).forEach(([key, value]) => {
		const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
		loginAfter.searchParams.set(snakeCaseKey, value as string);
	});

	return loginAfter.toString();
}

export const load = (async ({ params }) => {
	try {
		const weverseUrl = await getUrlWithAuth(params.path);

		const { page, terminate } = await BrowserSettings();
		const artistPostHelper = new WeverseArtistPostHelper(page);
		const comments = await artistPostHelper.getArtistComments(weverseUrl);
		await terminate();

		return {
			artistComments: flattenArtistComments(comments.data)
		};
	} catch (err) {
		console.log(err);
		throw error(500, 'Internal Server Error');
	}
}) satisfies PageServerLoad;
