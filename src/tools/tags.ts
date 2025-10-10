import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { Tag } from "../types.js";
import { getAllTagsToolDescription } from "../description.js";
import { getAllTagsSchema } from "../schema/tags.js";

export function registerTagTools(server: McpServer) {
    server.registerTool(
        "get_all_tags",
        {
            title: "Get All Tags",
            description: getAllTagsToolDescription,
            inputSchema: getAllTagsSchema.shape,
        },
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(`${baseUrl}/tags`, {
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get all tags: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const tags: Tag[] = await response.json();

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(tags),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get all tags: ${
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
