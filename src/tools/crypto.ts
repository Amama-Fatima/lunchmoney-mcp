import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { Crypto } from "../types.js";
import {
    getAllCryptoToolDescription,
    updateManualCryptoToolDescription,
} from "../description.js";
import {
    getAllCryptoSchema,
    updateManualCryptoSchema,
} from "../schema/crypto.js";

export function registerCryptoTools(server: McpServer) {
    server.registerTool(
        "get_all_crypto",
        {
            title: "Get All Crypto",
            description: getAllCryptoToolDescription,
            inputSchema: getAllCryptoSchema.shape,
        },
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(`${baseUrl}/crypto`, {
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get crypto assets: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const data = await response.json();
                const cryptoAssets: Crypto[] = data.crypto;

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(cryptoAssets),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get crypto assets: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    server.registerTool(
        "update_manual_crypto",
        {
            title: "Update Manual Crypto",
            description: updateManualCryptoToolDescription,
            inputSchema: updateManualCryptoSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const body: any = {};

            if (args.balance !== undefined) {
                body.balance = args.balance.toString();
            }

            try {
                const response = await fetch(
                    `${baseUrl}/crypto/manual/${args.crypto_id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${lunchmoneyApiToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(body),
                    }
                );

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to update crypto asset: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const result = await response.json();

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to update crypto asset: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}
