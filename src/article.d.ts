type Article = {
	id: string;
	body: string;
	profileName: string;
	profileImageUrl: string;
	children: Article[];
	createdAt?: number;
	parentId?: string;
};

export { Article };
