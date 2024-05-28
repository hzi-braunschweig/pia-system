"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTokenMockBuilder = void 0;
class AuthTokenMockBuilder {
    static createAuthHeader(tokenAttributes) {
        return { authorization: this.createToken(tokenAttributes) };
    }
    static createToken(tokenAttributes) {
        return this.buildToken(this.createTokenPayload(tokenAttributes));
    }
    static createTokenPayload({ username, roles, studies, }) {
        this.assertLowerCase(username);
        return {
            exp: 1700000000,
            iat: 1700000000,
            auth_time: 1700000000,
            iss: 'http://localhost/api/v1/auth/realms/pia-realm',
            aud: 'account',
            typ: 'Bearer',
            azp: 'pia-web-app-client',
            preferred_username: username,
            email_verified: false,
            'allowed-origins': ['http://localhost'],
            realm_access: {
                roles,
            },
            resource_access: {
                account: {
                    roles: ['manage-account', 'manage-account-links', 'view-profile'],
                },
            },
            scope: 'openid profile email',
            studies: studies,
            client_id: 'pia-web-app-client',
            username: username,
            locale: 'de-DE',
            active: true,
        };
    }
    static buildToken(tokenPayload) {
        return ('Bearer ' +
            this.toBase64(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
            '.' +
            this.toBase64(JSON.stringify(tokenPayload)) +
            '.' +
            this.toBase64('signature'));
    }
    static toBase64(value) {
        return Buffer.from(value).toString('base64').replace(/=/g, '');
    }
    static assertLowerCase(value) {
        if (value !== value.toLowerCase()) {
            throw new Error(`tokens cannot contain usernames in upper case: "${value}"`);
        }
    }
}
exports.AuthTokenMockBuilder = AuthTokenMockBuilder;
//# sourceMappingURL=authTokenMockBuilder.js.map