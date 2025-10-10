import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { Budget } from "../types.js";
import {
    getBudgetSummaryToolDescription,
    removeBudgetToolDescription,
    upsertBudgetToolDescription,
} from "../description.js";
import {
    getBudgetSummarySchema,
    upsertBudgetSchema,
    removeBudgetSchema,
} from "../schema/budgets.js";

export function registerBudgetTools(server: McpServer) {
    server.registerTool(
        "get_budget_summary",
        {
            title: "Get Budget Summary",
            description: getBudgetSummaryToolDescription,
            inputSchema: getBudgetSummarySchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const params = new URLSearchParams({
                start_date: args.start_date,
                end_date: args.end_date,
            });

            if (args.currency) {
                params.append("currency", args.currency);
            }

            try {
                const response = await fetch(`${baseUrl}/budgets?${params}`, {
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get budget summary: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const budgets: Budget[] = await response.json();

                // Filter to essential budget information only
                const minimalBudgets = budgets.map((budget) => ({
                    category_name: budget.category_name,
                    category_id: budget.category_id,
                    category_group_name: budget.category_group_name,
                    is_group: budget.is_group,
                    is_income: budget.is_income,
                    archived: budget.archived,
                    data: budget.data,
                    // Only include recurring info if it exists
                    ...(budget.recurring && { recurring: budget.recurring }),
                    // Only include config if it exists
                    ...(budget.config && { config: budget.config }),
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                budgets: minimalBudgets,
                                count: minimalBudgets.length,
                            }),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get budget summary: ${
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
        "upsert_budget",
        {
            title: "Upsert Budget",
            description: upsertBudgetToolDescription,
            inputSchema: upsertBudgetSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const body: any = {
                start_date: args.start_date,
                category_id: args.category_id,
                amount: args.amount,
            };

            if (args.currency) {
                body.currency = args.currency;
            }

            try {
                const response = await fetch(`${baseUrl}/budgets`, {
                    method: "PUT",
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
                                text: `Failed to upsert budget: ${response.statusText}`,
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
                            text: `Failed to upsert budget: ${
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
        "remove_budget",
        {
            title: "Remove Budget",
            description: removeBudgetToolDescription,
            inputSchema: removeBudgetSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const params = new URLSearchParams({
                start_date: args.start_date,
                category_id: args.category_id.toString(),
            });

            try {
                const response = await fetch(`${baseUrl}/budgets?${params}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to remove budget: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: "Budget removed successfully",
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to remove budget: ${
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
