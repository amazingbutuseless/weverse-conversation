import type puppeteer from 'puppeteer-core';

export class WeverseArtistPostHelper {
	readonly TIMEOUT = 15 * 1000;

	constructor(protected page: puppeteer.Page) {}

	async getArtistComments(postPath: string) {
		const page = this.page;

		page.goto(postPath, { timeout: this.TIMEOUT });

		const response = await page.waitForResponse((response) => {
			return response.url().includes('artistComments');
		});

		return response.json();
	}
}
