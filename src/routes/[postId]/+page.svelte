<script lang="ts">
	import artistComments from '$lib/data/artistComments.json';
	import SpeechBubble from '$lib/SpeechBubble.svelte';

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

	const articles = flattenArtistComments(artistComments.data);
	const root = articles.find((article) => !article.parentId);
</script>

<section>
	{#if root}
		<article>
			<header>
				<img src={root.profileImageUrl} alt={root.profileName} />
				<strong>{root.profileName}</strong>
			</header>
			{root.body}
		</article>

		<hr />

		{#each root.children as child}
			<SpeechBubble comment={child} author={root.profileName} />
		{/each}
	{/if}
</section>

<style>
	section {
		margin: 0 auto;
		max-width: 64rem;
		min-width: 36rem;
		font-size: 1.4rem;
	}

	header {
		display: flex;
		align-items: center;
		margin-bottom: 1.6rem;
	}

	img {
		margin-right: 1.6rem;
		width: 4.6rem;
		height: 4.6rem;
		border-radius: 50%;
	}

	hr {
		margin: 2.4rem 0;
		height: 0.1rem;
		border: 0;
		background-color: #ccc;
	}
</style>
