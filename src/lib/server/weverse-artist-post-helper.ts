import type playwright from 'playwright-core';

export class WeverseArtistPostHelper {
	readonly TIMEOUT = 15 * 1000;

	constructor(protected page: playwright.Page) {}

	async getArtistComments(postPath: string) {
		const page = this.page;

		await page.goto(postPath, { timeout: this.TIMEOUT });

		const response = await page.waitForResponse((response) => {
			return response.url().includes('artistComments');
		});

		return response.json();
	}
}
