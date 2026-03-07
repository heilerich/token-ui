export interface Token {
	id: string;
	name: string;
	scopes: string[];
	expires_at: string;
	created_at: string;
}

export interface CreateTokenRequest {
	name: string;
	scopes: string[];
}

export interface CreateTokenResponse {
	token: Token;
	secret: string;
}

export interface Scope {
	id: string;
	name: string;
	description: string;
}
