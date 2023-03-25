<script lang="ts">
	import { setContext } from 'svelte';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';

	import SpeechBubble from '$lib/SpeechBubble.svelte';

	export let data: PageData;

	const articles = data.artistComments;
	const root = articles.find((article) => !article.parentId);

	const comments = articles.filter((article) => !!article.createdAt) as Required<Article>[];
	comments.sort((a, b) => {
		return a.createdAt - b.createdAt;
	});

	const animateId = writable(comments[0].id);
	setContext('animateId', animateId);
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

		{#each root.children as child, idx}
			<SpeechBubble comment={child} author={root.profileName} next={root.children[idx + 1]?.id} />
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
