import { type } from 'arktype';

export const MatrixbirdServer = type({
    url: "string",
    "related?": "string[]"
});

export const HomeServer = type({
    base_url: "string",
    server_name: "string?"
});

export const ServerConfig = type({
    "matrixbird.server": MatrixbirdServer,
    "m.homeserver": HomeServer
});

export function createServerStore() {
    return {
        get server() {
            return serverConfig;
        },
    };
}



export type ServerConfigType = typeof ServerConfig.infer;

export const serverConfig:ServerConfigType = $state({
    "matrixbird.server": {
        url: "",
        "related?": []
    },
    "m.homeserver": {
        base_url: ""
    }
});
let configError = $state<string | null>(null);

export function setServerConfig(rawData: unknown) {
    const result = ServerConfig(rawData);

    if (result instanceof type.errors) {
        console.error('Validation failed:', result.summary);
        configError = result.summary;
    } else {
        serverConfig["matrixbird.server"].url = result["matrixbird.server"].url;
        if(result["matrixbird.server"]["related?"]) {
            serverConfig["matrixbird.server"].related = result["matrixbird.server"]["related?"] || [];
        }
        serverConfig["m.homeserver"].base_url = result["m.homeserver"].base_url;
        configError = null;
    }

    console.log("Auth config set:", $state.snapshot(serverConfig))
}
