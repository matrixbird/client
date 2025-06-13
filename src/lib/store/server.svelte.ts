import { type } from 'arktype';

export const MatrixbirdServer = type({
    url: "string",
    "related?": "string[]"
});

export const HomeServer = type({
    base_url: "string"
});

export const ServerConfig = type({
    "matrixbird.server": MatrixbirdServer,
    "m.homeserver": HomeServer
});


export type ServerConfigType = typeof ServerConfig.infer;

let serverConfig = $state<ServerConfigType | null>(null);
let configError = $state<string | null>(null);

export function setServerConfig(rawData: unknown) {
    const result = ServerConfig(rawData);

    if (result instanceof type.errors) {
        console.error('Validation failed:', result.summary);
        configError = result.summary;
        serverConfig = null;
    } else {
        serverConfig = result;
        configError = null;
    }

    console.log("Auth config set:", $state.snapshot(serverConfig))
}
