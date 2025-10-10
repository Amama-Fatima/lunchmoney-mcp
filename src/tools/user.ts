import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { User } from "../types.js";
import { getUserToolDescription } from "../description.js";
import { getUserSchema } from "../schema/user.js";

export function registerUserTools(server: McpServer) {
    server.registerTool(
        "get_user",
        {
            title: "Get User",
            description: getUserToolDescription,
            inputSchema: getUserSchema.shape,
        },
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(`${baseUrl}/me`, {
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get user details: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const user: User = await response.json();

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(user),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get user details: ${
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
