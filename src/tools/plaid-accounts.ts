import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { PlaidAccount } from "../types.js";
import {
    getAllPlaidAccountsToolDescription,
    triggerPlaidFetchToolDescription,
} from "../description.js";
import {
    getAllPlaidAccountsSchema,
    triggerPlaidFetchSchema,
} from "../schema/plaid-accounts.js";

export function registerPlaidAccountTools(server: McpServer) {
    server.registerTool(
        "get_all_plaid_accounts",
        {
            title: "Get All Plaid Accounts",
            description: getAllPlaidAccountsToolDescription,
            inputSchema: getAllPlaidAccountsSchema.shape,
        },
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(`${baseUrl}/plaid_accounts`, {
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                    },
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get Plaid accounts: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const data = await response.json();
                const plaidAccounts: PlaidAccount[] = data.plaid_accounts;

                // Filter to essential account information only
                const minimalPlaidAccounts = plaidAccounts.map((account) => ({
                    id: account.id,
                    name: account.name,
                    display_name: account.display_name,
                    type: account.type,
                    subtype: account.subtype,
                    mask: account.mask,
                    institution_name: account.institution_name,
                    status: account.status,
                    balance: account.balance,
                    currency: account.currency,
                    to_base: account.to_base,
                    limit: account.limit,
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                plaid_accounts: minimalPlaidAccounts,
                                count: minimalPlaidAccounts.length,
                            }),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get Plaid accounts: ${
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
        "trigger_plaid_fetch",
        {
            title: "Trigger Plaid Fetch",
            description: triggerPlaidFetchToolDescription,
            inputSchema: triggerPlaidFetchSchema.shape,
        },
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(
                    `${baseUrl}/plaid_accounts/fetch`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${lunchmoneyApiToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to trigger Plaid fetch: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: "Plaid fetch triggered successfully. Fetching may take up to 5 minutes.",
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to trigger Plaid fetch: ${
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
