import type { PageLoad } from './$types';

import artistComments from '$lib/data/artistComments.json';

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
				body: parent.data.body,
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

export const load = (() => {
	return {
		artistComments: flattenArtistComments(artistComments.data)
	};
}) satisfies PageLoad;
