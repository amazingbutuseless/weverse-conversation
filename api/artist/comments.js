import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { v4 as uuidv4 } from 'uuid';

const BrowserSettings = (() => {
	let browser;
	let page;

	async function init() {
		const options = {
			args: [...chromium.args, '--lang=ko-KR'],
			executablePath:
				(await chromium.executablePath) ||
				'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
			headless: chromium.headless
		};
		browser = await puppeteer.launch(options);

		page = await browser.newPage();
		await page.setViewport({ width: 768, height: 403 });
	}

	function terminate() {
		return browser.close();
	}

	return async () => {
		await init();

		return {
			page,
			terminate
		};
	};
})();

class WeverseArtistPostHelper {
	page;
	TIMEOUT = 15 * 1000;

	constructor(page) {
		this.page = page;
	}

	async getArtistComments(postPath) {
		const page = this.page;

		page.goto(postPath, { timeout: this.TIMEOUT });

		const response = await page.waitForResponse((response) => {
			return response.url().includes('artistComments');
		});

		return response.json();
	}
}

async function authenticate() {
	const { WEV_APP_SECRET, WEV_EMAIL, WEV_PASSWORD } = process.env;

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

async function getUrlWithAuth(path) {
	const loginAfter = new URL('https://weverse.io/loginResult');
	loginAfter.searchParams.set('topath', `/${path}`);

	const token = await authenticate();
	Object.entries(token).forEach(([key, value]) => {
		const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
		loginAfter.searchParams.set(snakeCaseKey, value);
	});

	return loginAfter.toString();
}

function flattenArtistComments(comments) {
	const flattened = [];

	comments.forEach((comment) => {
		const {
			commentId: id,
			body,
			author: { profileName, profileImageUrl },
			createdAt
		} = comment;
		const parent = comment.parent;
		const parentId = parent.type === 'POST' ? parent.data.postId : parent.data.commentId;

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

export default async function handler(req, res) {
	const path = req.query.path;

	let status = 400;
	let responseBody = { message: 'path is required' };

	if (path) {
		try {
			const weverseUrl = await getUrlWithAuth(path);

			const { page, terminate } = await BrowserSettings();
			const artistPostHelper = new WeverseArtistPostHelper(page);
			const comments = await artistPostHelper.getArtistComments(weverseUrl);
			await terminate();

			status = 200;
			responseBody = {
				artistComments: flattenArtistComments(comments.data)
			};
		} catch (err) {
			console.log(err);
			status = 500;
			responseBody = { message: err instanceof Error ? err.message : 'Something went wrong' };
		}
	}

	res.status(status).json(responseBody);
}
