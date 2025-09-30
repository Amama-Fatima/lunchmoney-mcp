import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { Tag } from "../types.js";
import { getAllTagsToolDescription } from "../description.js";

export function registerTagTools(server: McpServer) {
    server.tool("get_all_tags", getAllTagsToolDescription, {}, async () => {
        const { baseUrl, lunchmoneyApiToken } = getConfig();
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
    });
}
