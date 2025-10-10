import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "../config.js";
import { Transaction } from "../types.js";
import {
    createTransactionGroupToolDescription,
    createTransactionToolDescription,
    deleteTransactionGroupToolDescription,
    getCategoryTotalsToolDescription,
    getSingleTransactionToolDescription,
    getTransactionGroupToolDescription,
    getTransactionsToolDescription,
    unsplitTransactionToolDescription,
    updateTransactionToolDescription,
} from "../description.js";
import {
    createTransactionGroupSchema,
    createTransactionsSchema,
    deleteTransactionGroupSchema,
    getCategoryTotalsSchema,
    getSingleTransactionSchema,
    getTransactionGroupSchema,
    getTransactionsSchema,
    unsplitTransactionsSchema,
    updateTransactionSchema,
} from "../schema/transactions.js";

export function registerTransactionTools(server: McpServer) {
    server.registerTool(
        "get_transactions",
        {
            title: "Get Transactions",
            description: getTransactionsToolDescription,
            inputSchema: getTransactionsSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            // Helper function to build query parameters
            const buildParams = (offset = 0, limit = 500) => {
                const params = new URLSearchParams({
                    start_date: args.start_date,
                    end_date: args.end_date,
                    offset: offset.toString(),
                    limit: limit.toString(),
                });

                if (args.tag_id !== undefined)
                    params.append("tag_id", args.tag_id.toString());
                if (args.recurring_id !== undefined)
                    params.append("recurring_id", args.recurring_id.toString());
                if (args.plaid_account_id !== undefined)
                    params.append(
                        "plaid_account_id",
                        args.plaid_account_id.toString()
                    );
                if (args.category_id !== undefined)
                    params.append("category_id", args.category_id.toString());
                if (args.asset_id !== undefined)
                    params.append("asset_id", args.asset_id.toString());
                if (args.is_group !== undefined)
                    params.append("is_group", args.is_group.toString());
                if (args.status !== undefined)
                    params.append("status", args.status);
                if (args.debit_as_negative !== undefined)
                    params.append(
                        "debit_as_negative",
                        args.debit_as_negative.toString()
                    );

                return params;
            };

            // Helper function to make API request
            const fetchTransactions = async (offset: number, limit: number) => {
                const params = buildParams(offset, limit);
                const response = await fetch(
                    `${baseUrl}/transactions?${params}`,
                    {
                        headers: {
                            Authorization: `Bearer ${lunchmoneyApiToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `API request failed: ${response.statusText}`
                    );
                }

                return await response.json();
            };

            // Helper function to format transactions for dashboard
            const formatTransactions = (transactions: Transaction[]) => {
                return transactions.map((t) => ({
                    id: t.id,
                    date: t.date,
                    category_name: t.category_name,
                    payee: t.payee,
                    amount: t.amount,
                    currency: t.currency,
                    account_display_name: t.plaid_account_display_name,
                    tags: t.tags?.map((tag) => tag.name) || [],
                }));
            };

            try {
                if (args.fetch_all) {
                    // Automatic pagination mode
                    let allTransactions = [];
                    let offset = 0;
                    const batchSize = 500;
                    let hasMore = true;
                    let requestCount = 0;

                    console.log(
                        `Starting pagination fetch from ${args.start_date} to ${args.end_date}`
                    );

                    while (
                        hasMore &&
                        allTransactions.length < args.max_transactions
                    ) {
                        requestCount++;
                        console.log(
                            `Fetching batch ${requestCount}, offset: ${offset}`
                        );

                        const data = await fetchTransactions(offset, batchSize);
                        const transactions = data.transactions || [];

                        allTransactions.push(...transactions);

                        hasMore =
                            data.has_more && transactions.length === batchSize;
                        offset += batchSize;

                        if (requestCount > 100) {
                            console.warn(
                                "Reached maximum request limit (100 requests)"
                            );
                            break;
                        }

                        console.log(
                            `Batch ${requestCount} complete. Total transactions: ${allTransactions.length}, has_more: ${data.has_more}`
                        );
                    }

                    const dashboardTransactions =
                        formatTransactions(allTransactions);

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    transactions: dashboardTransactions,
                                    total_count: dashboardTransactions.length,
                                    requests_made: requestCount,
                                    fetched_all:
                                        !hasMore ||
                                        allTransactions.length >=
                                            args.max_transactions,
                                    truncated_at_limit:
                                        allTransactions.length >=
                                        args.max_transactions,
                                    date_range: {
                                        start: args.start_date,
                                        end: args.end_date,
                                    },
                                }),
                            },
                        ],
                    };
                } else {
                    // Single request mode
                    const limit = args.limit || 500;
                    const offset = args.offset || 0;

                    console.log(
                        `Single request mode: offset=${offset}, limit=${limit}`
                    );

                    const data = await fetchTransactions(offset, limit);
                    const dashboardTransactions = formatTransactions(
                        data.transactions || []
                    );

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    transactions: dashboardTransactions,
                                    has_more: data.has_more,
                                    count: dashboardTransactions.length,
                                    offset: offset,
                                    limit: limit,
                                }),
                            },
                        ],
                    };
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get transactions: ${
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
        "get_category_totals",
        {
            title: "Get Category Totals",
            description: getCategoryTotalsToolDescription,
            inputSchema: getCategoryTotalsSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            // Helper to fetch all transactions (with pagination) matching filters
            async function fetchAllTransactions(): Promise<Transaction[]> {
                const all: Transaction[] = [];
                let offset = 0;
                const limit = 500;
                let hasMore = true;
                let requestCount = 0;

                while (hasMore) {
                    const params = new URLSearchParams({
                        start_date: args.start_date,
                        end_date: args.end_date,
                        offset: offset.toString(),
                        limit: limit.toString(),
                    });
                    if (args.debit_as_negative !== undefined) {
                        params.append(
                            "debit_as_negative",
                            args.debit_as_negative.toString()
                        );
                    }
                    if (args.category_id !== undefined) {
                        params.append(
                            "category_id",
                            args.category_id.toString()
                        );
                    }
                    if (args.plaid_account_id !== undefined) {
                        params.append(
                            "plaid_account_id",
                            args.plaid_account_id.toString()
                        );
                    }
                    if (args.asset_id !== undefined) {
                        params.append("asset_id", args.asset_id.toString());
                    }

                    const resp = await fetch(
                        `${baseUrl}/transactions?${params}`,
                        {
                            headers: {
                                Authorization: `Bearer ${lunchmoneyApiToken}`,
                            },
                        }
                    );
                    if (!resp.ok) {
                        throw new Error(
                            `Failed to fetch transactions: ${resp.statusText}`
                        );
                    }
                    const data = await resp.json();
                    const txs: Transaction[] = data.transactions || [];
                    all.push(...txs);

                    hasMore = data.has_more && txs.length === limit;
                    offset += limit;

                    requestCount += 1;
                    // Safety: prevent infinite loop
                    if (requestCount > 100) {
                        console.warn(
                            "Too many pagination requests in get_category_totals"
                        );
                        break;
                    }
                }

                return all;
            }

            try {
                const transactions = await fetchAllTransactions();

                // Aggregate logic
                const totals: Record<
                    string,
                    { total: number; subcategories: Record<string, number> }
                > = {};

                for (const t of transactions) {
                    const category = t.category_name ?? "Uncategorized";
                    const subcategory = t.category_group_name ?? "No group";

                    if (!totals[category]) {
                        totals[category] = { total: 0, subcategories: {} };
                    }

                    const amt = parseFloat(t.amount);
                    totals[category].total += amt;

                    if (!totals[category].subcategories[subcategory]) {
                        totals[category].subcategories[subcategory] = 0;
                    }
                    totals[category].subcategories[subcategory] += amt;
                }

                // If category_id was provided and you want to simplify the output
                if (args.category_id !== undefined) {
                    const keys = Object.keys(totals);
                    if (keys.length === 0) {
                        // no transactions in that category
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        start_date: args.start_date,
                                        end_date: args.end_date,
                                        category_id: args.category_id,
                                        totals: null,
                                    }),
                                },
                            ],
                        };
                    } else {
                        const onlyCat = keys[0];
                        const result = {
                            start_date: args.start_date,
                            end_date: args.end_date,
                            category_id: args.category_id,
                            category_name: onlyCat,
                            total: totals[onlyCat].total,
                            subcategories: totals[onlyCat].subcategories,
                        };
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result),
                                },
                            ],
                        };
                    }
                }

                // Otherwise, return full breakdown over all categories
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                start_date: args.start_date,
                                end_date: args.end_date,
                                totals,
                            }),
                        },
                    ],
                };
            } catch (err) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error in get_category_totals: ${
                                err instanceof Error ? err.message : String(err)
                            }`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    server.registerTool(
        "get_single_transaction",
        {
            title: "Get Single Transaction",
            description: getSingleTransactionToolDescription,
            inputSchema: getSingleTransactionSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const params = new URLSearchParams();
            if (args.debit_as_negative !== undefined) {
                params.append(
                    "debit_as_negative",
                    args.debit_as_negative.toString()
                );
            }

            const url = params.toString()
                ? `${baseUrl}/transactions/${args.transaction_id}?${params}`
                : `${baseUrl}/transactions/${args.transaction_id}`;

            try {
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
                                text: `Failed to get transaction: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const transaction: Transaction = await response.json();

                // Return only essential transaction details
                const minimalTransaction = {
                    id: transaction.id,
                    date: transaction.date,
                    payee: transaction.payee,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    category_id: transaction.category_id,
                    category_name: transaction.category_name,
                    category_group_name: transaction.category_group_name,
                    status: transaction.status,
                    is_income: transaction.is_income,
                    account_display_name:
                        transaction.plaid_account_display_name,
                    ...(transaction.notes && { notes: transaction.notes }),
                    tags: transaction.tags?.map((tag) => tag.name) || [],
                    // Only include relationship fields if they have actual values
                    ...(transaction.parent_id && {
                        parent_id: transaction.parent_id,
                    }),
                    ...(transaction.group_id && {
                        group_id: transaction.group_id,
                    }),
                    ...(transaction.is_group && {
                        is_group: transaction.is_group,
                    }),
                    ...(transaction.has_children && {
                        has_children: transaction.has_children,
                    }),
                    ...(transaction.recurring_id && {
                        recurring_id: transaction.recurring_id,
                        recurring_payee: transaction.recurring_payee,
                        recurring_cadence: transaction.recurring_cadence,
                    }),
                    ...(transaction.external_id && {
                        external_id: transaction.external_id,
                    }),
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(minimalTransaction),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get transaction: ${
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
        "create_transactions",
        {
            title: "Create Transactions",
            description: createTransactionToolDescription,
            inputSchema: createTransactionsSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const body: any = {
                transactions: args.transactions,
            };

            if (args.apply_rules !== undefined)
                body.apply_rules = args.apply_rules;
            if (args.skip_duplicates !== undefined)
                body.skip_duplicates = args.skip_duplicates;
            if (args.check_for_recurring !== undefined)
                body.check_for_recurring = args.check_for_recurring;
            if (args.debit_as_negative !== undefined)
                body.debit_as_negative = args.debit_as_negative;
            if (args.skip_balance_update !== undefined)
                body.skip_balance_update = args.skip_balance_update;

            try {
                const response = await fetch(`${baseUrl}/transactions`, {
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
                                text: `Failed to create transactions: ${response.statusText}`,
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
                            text: `Failed to create transactions: ${
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
        "update_transaction",
        {
            title: "Update Transaction",
            description: updateTransactionToolDescription,
            inputSchema: updateTransactionSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const body: any = {
                transaction: args.transaction,
            };

            if (args.debit_as_negative !== undefined)
                body.debit_as_negative = args.debit_as_negative;
            if (args.skip_balance_update !== undefined)
                body.skip_balance_update = args.skip_balance_update;

            try {
                const response = await fetch(
                    `${baseUrl}/transactions/${args.transaction_id}`,
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
                                text: `Failed to update transaction: ${response.statusText}`,
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
                            text: `Failed to update transaction: ${
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
        "unsplit_transactions",
        {
            title: "Unsplit Transactions",
            description: unsplitTransactionToolDescription,
            inputSchema: unsplitTransactionsSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(
                    `${baseUrl}/transactions/unsplit`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${lunchmoneyApiToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            parent_ids: args.parent_ids,
                            remove_parents: args.remove_parents,
                        }),
                    }
                );

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to unsplit transactions: ${response.statusText}`,
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
                            text: `Failed to unsplit transactions: ${
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
        "get_transaction_group",
        {
            title: "Get Transaction Group",
            description: getTransactionGroupToolDescription,
            inputSchema: getTransactionGroupSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(
                    `${baseUrl}/transactions/group/${args.transaction_id}`,
                    {
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
                                text: `Failed to get transaction group: ${response.statusText}`,
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
                            text: `Failed to get transaction group: ${
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
        "create_transaction_group",
        {
            title: "Create Transaction Group",
            description: createTransactionGroupToolDescription,
            inputSchema: createTransactionGroupSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(`${baseUrl}/transactions/group`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(args),
                });

                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to create transaction group: ${response.statusText}`,
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
                            text: `Failed to create transaction group: ${
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
        "delete_transaction_group",
        {
            title: "Delete Transaction Group",
            description: deleteTransactionGroupToolDescription,
            inputSchema: deleteTransactionGroupSchema.shape,
        },
        async (args) => {
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
                const response = await fetch(
                    `${baseUrl}/transactions/group/${args.transaction_id}`,
                    {
                        method: "DELETE",
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
                                text: `Failed to delete transaction group: ${response.statusText}`,
                            },
                        ],
                        isError: true,
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: "Transaction group deleted successfully",
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to delete transaction group: ${
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
