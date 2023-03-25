<script lang="ts">
	export let comment: Article;
	export let author: string;

	const createdAt = new Date(comment.createdAt || Date.now());
	const direction = author === comment.profileName ? 'left' : 'right';
</script>

<article class={direction}>
	<img src={comment.profileImageUrl} alt={comment.profileName} />
	<div>
		<p>
			{comment.body}
		</p>
		<svg
			width="18"
			height="20"
			viewBox="0 0 18 20"
			xmlns="http://www.w3.org/2000/svg"
			fill={direction === 'left' ? '#FFF4BB' : '#C5ECE8'}
		>
			<path
				d="M2.22403 2.55128C7.7188 3.97978 11.1725 9.03066 11.0002 15.9337C10.7964 24.1044 19.0082 17.1748 17.4207 7.06949C16.2708 -0.250529 7.12137 0.448643 2.16508 1.39016C1.60299 1.49693 1.67029 2.40732 2.22403 2.55128Z"
				fill="current"
			/>
		</svg>
	</div>
	<time datetime={createdAt.toISOString()}>{`${createdAt.toLocaleString()}`}</time>
</article>

{#each comment.children as child}
	<svelte:self comment={child} {author} />
{/each}

<style>
	article {
		--body-color: #111;
		--time-color: #7d9391;

		display: grid;
		grid-template-columns: 4.6rem 1fr 4.6rem;
		grid-column-gap: 1.6rem;
		margin-bottom: 1.6rem;
	}

	article > div {
		grid-row: 1;
		grid-column: 2;
		display: flex;
		align-items: center;
		position: relative;
	}

	article.right > div {
		justify-content: flex-end;
	}

	p {
		margin: 0;
		padding: 1.6rem 2rem;
		background-image: linear-gradient(90deg, #fff4bb 0%, #c5ece8 100%);
		font-size: 1.4rem;
		color: var(--body-color);
	}

	img {
		grid-row: 1;
		grid-column: 1;
		display: block;
		width: 4.6rem;
		height: 4.6rem;
		border-radius: 50%;
		margin-bottom: 1.6rem;
	}

	article.right img {
		grid-column: 3;
	}

	time {
		grid-row: 2;
		grid-column: 2;
		display: block;
		margin-top: 0.4rem;
		font-size: 1.2rem;
		color: var(--time-color);
	}

	article.right time {
		text-align: right;
	}

	svg {
		position: absolute;
		top: 0.6rem;
		left: -1rem;
	}

	article.right svg {
		left: auto;
		right: -1rem;
		transform: scaleX(-1);
	}
</style>
