import { redirect } from "@sveltejs/kit";
import { error } from '@sveltejs/kit';

import { type } from 'arktype';
import { parse } from 'tldts';
import { ServerConfig } from '$lib/store/server.svelte';

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ( { cookies, fetch, url } ) => {

    let data: any;

    let access_token = cookies.get("access_token");

    if(access_token) {
        redirect(303, '/mail/inbox');
    }

    let domain = parse(url.origin).domain;
    console.log("Domain:", domain);

    const endpoint = `https://${domain}/.well-known/matrixbird/client`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Failed to fetch server configuration');
        }

        const raw = await response.json();

        const validated = ServerConfig(raw);

        if (validated instanceof type.errors) {
            console.error('Server config validation failed:', validated.summary);
            throw new Error('Invalid server configuration');
        }

        data = raw

    } catch (err: any) {
        console.error("Error:", err);
        error(500, {
            message: err?.message,
        });
    }

    return data;
}
