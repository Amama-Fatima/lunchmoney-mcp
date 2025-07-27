import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig } from "../config.js";
import { RecurringItem } from "../types.js";

export function registerRecurringItemsTools(server: McpServer) {
    server.tool(
        "get_recurring_items",
        "Retrieve a list of recurring items to expect for a specified month",
        {
            input: z.object({
                start_date: z
                    .string()
                    .optional()
                    .describe("Start date in YYYY-MM-DD format. Defaults to first day of current month"),
                end_date: z
                    .string()
                    .optional()
                    .describe("End date in YYYY-MM-DD format"),
                debit_as_negative: z
                    .boolean()
                    .optional()
                    .describe("Pass true to return debit amounts as negative"),
            }),
        },
        async ({ input }) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            
            const params = new URLSearchParams();
            if (input.start_date) params.append("start_date", input.start_date);
            if (input.end_date) params.append("end_date", input.end_date);
            if (input.debit_as_negative !== undefined) {
                params.append("debit_as_negative", input.debit_as_negative.toString());
            }
            
            const url = params.toString() 
                ? `${baseUrl}/recurring_items?${params}`
                : `${baseUrl}/recurring_items`;
                
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${lunchmoneyApiToken}`,
                },
            });

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get recurring items: ${response.statusText}`,
                        },
                    ],
                };
            }

            const recurringItems: RecurringItem[] = await response.json();
            
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(recurringItems),
                    },
                ],
            };
        }
    );
}