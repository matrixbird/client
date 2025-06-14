import { PUBLIC_MATRIXBIRD_SERVER } from '$env/static/public';

export const login = async (server: string, body: object) => {

    if(!server || server === 'null' || server === 'undefined') {
        throw new Error('Server URL is required');
    }

    const url = `${server}/auth/login`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const verify_email = async (body: object) => {
    console.log(body)
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/email/verify`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const verify_code = async (body: object) => {
    console.log(body)
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/code/verify`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const verify_password_reset_code = async (body: object) => {
    console.log(body)
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/password/code/verify`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const signup = async (server: string, body: object) => {

    if(!server || server === 'null' || server === 'undefined') {
        throw new Error('Server URL is required');
    }

    const url = `${server}/auth/signup`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const usernameAvailable = async (server: string, username: string) => {

    if(!server || server === 'null' || server === 'undefined') {
        throw new Error('Server URL is required');
    }

    const url = `${server}/auth/username/available/${username}`;

    let options = {
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

export const request_invite = async (email: string) => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/request/invite/${email}`;

    let options = {
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

export const request_password_reset = async (body: object) => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/password/reset`;

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const update_password = async (body: object) => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/password/update`;

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const query_code = async (code: string) => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/code/validate/${code}`;

    let options = {
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

export const valid_domain = async (domain: string) => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/domain/${domain}`;

    let options = {
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

export const valid_email = async (email: string) => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/email/${email}`;

    let options = {
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

export const getFeatures = async () => {
    const url = `${PUBLIC_MATRIXBIRD_SERVER}/features`;

    let options = {
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

