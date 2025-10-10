import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig } from "../config.js";
import { Asset } from "../types.js";
import {
    createAssetToolDescription,
    getAllAssetsToolDescription,
    updateAssetToolDescription,
} from "../description.js";
import {
    createAssetSchema,
    getAllAssetsSchema,
    updateAssetSchema,
} from "../schema/assets.js";

export function registerAssetTools(server: McpServer) {
    server.registerTool(
        "get_all_assets",
        {
            title: "Get All Assets",
            description: getAllAssetsToolDescription,
            inputSchema: getAllAssetsSchema.shape,
        },
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(`${baseUrl}/assets`, {
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get assets: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const data = await response.json();
                const assets: Asset[] = data.assets;

                // Filter to essential asset information only
                const minimalAssets = assets.map((asset) => ({
                    id: asset.id,
                    name: asset.name,
                    display_name: asset.display_name,
                    type_name: asset.type_name,
                    subtype_name: asset.subtype_name,
                    balance: asset.balance,
                    currency: asset.currency,
                    to_base: asset.to_base,
                    institution_name: asset.institution_name,
                    ...(asset.closed_on && { closed_on: asset.closed_on }),
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                assets: minimalAssets,
                                count: minimalAssets.length,
                            }),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get assets: ${
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
        "create_asset",
        {
            title: "Create Asset",
            description: createAssetToolDescription,
            inputSchema: createAssetSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const body: any = {
                type_name: args.type_name,
                name: args.name,
                balance: args.balance.toString(),
            };

            if (args.subtype_name) body.subtype_name = args.subtype_name;
            if (args.display_name) body.display_name = args.display_name;
            if (args.balance_as_of) body.balance_as_of = args.balance_as_of;
            if (args.currency) body.currency = args.currency;
            if (args.institution_name)
                body.institution_name = args.institution_name;
            if (args.closed_on) body.closed_on = args.closed_on;
            if (args.exclude_transactions !== undefined)
                body.exclude_transactions = args.exclude_transactions;

            try {
                const response = await fetch(`${baseUrl}/assets`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to create asset: ${response.statusText}`,
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
                            text: `Failed to create asset: ${
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
        "update_asset",
        {
            title: "Update Asset",
            description: updateAssetToolDescription,
            inputSchema: updateAssetSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const body: any = {};

            if (args.type_name) body.type_name = args.type_name;
            if (args.subtype_name) body.subtype_name = args.subtype_name;
            if (args.name) body.name = args.name;
            if (args.display_name) body.display_name = args.display_name;
            if (args.balance !== undefined)
                body.balance = args.balance.toString();
            if (args.balance_as_of) body.balance_as_of = args.balance_as_of;
            if (args.currency) body.currency = args.currency;
            if (args.institution_name)
                body.institution_name = args.institution_name;
            if (args.closed_on) body.closed_on = args.closed_on;
            if (args.exclude_transactions !== undefined)
                body.exclude_transactions = args.exclude_transactions;

            try {
                const response = await fetch(
                    `${baseUrl}/assets/${args.asset_id}`,
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
                                text: `Failed to update asset: ${response.statusText}`,
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
                            text: `Failed to update asset: ${
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
