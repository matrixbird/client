import { PUBLIC_HOMESERVER, PUBLIC_BASE_URL, PUBLIC_APP_NAME} from '$env/static/public';

import type { ValidatedAuthMetadata } from 'matrix-js-sdk/src/oidc/validate'

export const MATRIX_BASE_URL = `${PUBLIC_HOMESERVER}/_matrix/client/v3`

export const whoami = async (access_token: string) => {
    const url = `${MATRIX_BASE_URL}/account/whoami`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const registerOauthClient = async (registration_endpoint: string) => {

    if(!registration_endpoint) {
        throw new Error('Missing token endpoint')
    }

    let body = {
        application_type: "web",
        client_name: "Matrixbird",
        client_uri: `${PUBLIC_BASE_URL}`,
        logo_uri: "https://static.matrixbird.com/logo.png",
        token_endpoint_auth_method: "none",
        redirect_uris: [
            `${PUBLIC_BASE_URL}/oidc/callback`
        ],
        response_types: [
            "code"
        ],
        grant_types: [
            "authorization_code",
            "refresh_token"
        ]
    }

    const options: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(registration_endpoint, options)
        return response.json();
    } catch (error) {
        throw error
    }
}



export const getAuthMetadata = async (): Promise<ValidatedAuthMetadata | undefined> => {

    const url = `${PUBLIC_HOMESERVER}/_matrix/client/unstable/org.matrix.msc2965/auth_metadata`;

    const options: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }
}


export const exchangeForToken = async (url: string, params: any) => {

    const options: RequestInit = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: params
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }
}

export const refreshToken = async (url: string, params: any) => {

    const options: RequestInit = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: params
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }
}

export const revokeToken = async (url: string, params: any) => {

    const options: RequestInit = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: params
    }

    try {
        const response = await fetch(url, options)
        return response;
    } catch (error) {
        throw error
    }
}
