import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { PlaidAccount } from "../types.js";

export function registerPlaidAccountTools(server: McpServer) {
    server.tool(
        "get_all_plaid_accounts",
        "Get a list of all Plaid accounts associated with the user",
        {},
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

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
        }
    );

    server.tool(
        "trigger_plaid_fetch",
        "Trigger a fetch of latest data from Plaid (Experimental). Note that fetching may take up to 5 minutes.",
        {},
        async () => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const response = await fetch(`${baseUrl}/plaid_accounts/fetch`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${lunchmoneyApiToken}`,
                },
            });

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to trigger Plaid fetch: ${response.statusText}`,
                        },
                    ],
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
        }
    );
}
