import { env } from '$env/dynamic/public';
import { redirect } from "@sveltejs/kit";
import { error } from '@sveltejs/kit';

import { type } from 'arktype';
import { parse } from 'tldts';
import { ServerConfig } from '$lib/store/server.svelte';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ( { params, cookies, fetch, url } ) => {

    let skip = url.pathname === '/logout' ||
        url.pathname === '/signup/profile';

    // Check if the user is already authenticated
    let access_token = cookies.get("access_token");
    // If the user is authenticated (and not trying to log out), redirect to inbox
    if(access_token && !skip) {
        redirect(303, '/mail/inbox');
    }

    let data: {
        MATRIXBIRD_SERVER?: string;
        HOMESERVER?: string;
        RELATED_SERVERS?: string[];
    } = {};


    let MATRIXBIRD_SERVER = env.PUBLIC_MATRIXBIRD_SERVER;
    let HOMESERVER = env.PUBLIC_HOMESERVER;
    let RELATED_SERVERS = env.PUBLIC_RELATED_SERVERS;

    // Skip server discovery if MATRIXBIRD_SERVER is set in env
    if(MATRIXBIRD_SERVER && HOMESERVER) {
        data["MATRIXBIRD_SERVER"] = MATRIXBIRD_SERVER;
        data["HOMESERVER"] = HOMESERVER;

        if(RELATED_SERVERS) {
            data["RELATED_SERVERS"] = RELATED_SERVERS.split(",");
        }
        console.log("Using env variables for server configuration", data);
        return data;
    }


    // Fallback to server discovery if env variables are not set

    let domain = parse(url.origin).domain;
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

        data["MATRIXBIRD_SERVER"] = validated["matrixbird.server"].url
        data["HOMESERVER"] = validated["m.homeserver"].base_url

        if(validated["matrixbird.server"]?.related) {
            data["RELATED_SERVERS"] = validated["matrixbird.server"].related
        }

        return data;

    } catch (err: any) {
        console.error("Error:", err);
        error(500, {
            message: err?.message,
        });
    }

}
