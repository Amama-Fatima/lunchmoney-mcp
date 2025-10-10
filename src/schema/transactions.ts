import { z } from "zod";

const getTransactionsSchema = z.object({
    start_date: z.string().describe("Start date in YYYY-MM-DD format"),
    end_date: z.string().describe("End date in YYYY-MM-DD format"),
    tag_id: z.number().optional().describe("Filter by tag ID"),
    recurring_id: z
        .number()
        .optional()
        .describe("Filter by recurring expense ID"),
    plaid_account_id: z
        .number()
        .optional()
        .describe("Filter by Plaid account ID"),
    category_id: z.number().optional().describe("Filter by category ID"),
    asset_id: z.number().optional().describe("Filter by asset ID"),
    is_group: z.boolean().optional().describe("Filter by transaction groups"),
    status: z
        .string()
        .optional()
        .describe("Filter by status: cleared, uncleared, pending"),
    offset: z
        .number()
        .optional()
        .describe(
            "Number of transactions to skip (only used when fetch_all is false)"
        ),
    limit: z
        .number()
        .optional()
        .describe(
            "Maximum number of transactions to return (max 500, only used when fetch_all is false)"
        ),
    debit_as_negative: z
        .boolean()
        .optional()
        .describe("Pass true to return debit amounts as negative"),
    fetch_all: z
        .boolean()
        .optional()
        .default(true)
        .describe(
            "Fetch all transactions using pagination (recommended). Set to false to use manual limit/offset"
        ),
    max_transactions: z
        .number()
        .optional()
        .default(10000)
        .describe(
            "Safety limit for maximum transactions to fetch (prevents infinite loops)"
        ),
});

const getCategoryTotalsSchema = z.object({
    start_date: z.string().describe("Start date in YYYY-MM-DD format"),
    end_date: z.string().describe("End date in YYYY-MM-DD format"),
    debit_as_negative: z
        .boolean()
        .optional()
        .describe("Return debits as negative"),
    category_id: z
        .number()
        .optional()
        .describe("If provided, filter to this category"),
    plaid_account_id: z
        .number()
        .optional()
        .describe("Filter by Plaid account ID"),
    asset_id: z.number().optional().describe("Filter by asset ID"),
});

const getSingleTransactionSchema = z.object({
    transaction_id: z.number().describe("ID of the transaction to retrieve"),
    debit_as_negative: z
        .boolean()
        .optional()
        .describe("Pass true to return debit amounts as negative"),
});

const transactionObjectSchema = z.object({
    date: z.string().describe("Date in YYYY-MM-DD format"),
    payee: z.string().describe("Payee name"),
    amount: z.string().describe("Amount as string with up to 4 decimal places"),
    currency: z
        .string()
        .optional()
        .describe("Three-letter lowercase currency code"),
    category_id: z.number().optional().describe("Category ID"),
    asset_id: z.number().optional().describe("Asset ID for manual accounts"),
    recurring_id: z.number().optional().describe("Recurring expense ID"),
    notes: z.string().optional().describe("Transaction notes"),
    status: z
        .enum(["cleared", "uncleared", "pending"])
        .optional()
        .describe("Transaction status"),
    external_id: z
        .string()
        .optional()
        .describe("External ID (max 75 characters)"),
    tags: z.array(z.number()).optional().describe("Array of tag IDs"),
});

const createTransactionsSchema = z.object({
    transactions: z
        .array(transactionObjectSchema)
        .describe("Array of transactions to create"),
    apply_rules: z
        .boolean()
        .optional()
        .describe("Apply account's rules to transactions"),
    skip_duplicates: z
        .boolean()
        .optional()
        .describe("Skip transactions that are potential duplicates"),
    check_for_recurring: z
        .boolean()
        .optional()
        .describe("Check if transactions are part of recurring expenses"),
    debit_as_negative: z
        .boolean()
        .optional()
        .describe("Pass true if debits are provided as negative amounts"),
    skip_balance_update: z
        .boolean()
        .optional()
        .describe("Skip updating balance for assets/accounts"),
});

const updateTransactionSchema = z.object({
    transaction_id: z.number().describe("ID of the transaction to update"),
    transaction: z
        .object({
            date: z.string().optional().describe("Date in YYYY-MM-DD format"),
            payee: z.string().optional().describe("Payee name"),
            amount: z
                .string()
                .optional()
                .describe("Amount as string with up to 4 decimal places"),
            currency: z
                .string()
                .optional()
                .describe("Three-letter lowercase currency code"),
            category_id: z.number().optional().describe("Category ID"),
            asset_id: z
                .number()
                .optional()
                .describe("Asset ID for manual accounts"),
            recurring_id: z
                .number()
                .optional()
                .describe("Recurring expense ID"),
            notes: z.string().optional().describe("Transaction notes"),
            status: z
                .enum(["cleared", "uncleared", "pending"])
                .optional()
                .describe("Transaction status"),
            external_id: z
                .string()
                .optional()
                .describe("External ID (max 75 characters)"),
            tags: z.array(z.number()).optional().describe("Array of tag IDs"),
        })
        .describe("Transaction data to update"),
    debit_as_negative: z
        .boolean()
        .optional()
        .describe("Pass true if debits are provided as negative amounts"),
    skip_balance_update: z
        .boolean()
        .optional()
        .describe("Skip updating balance for assets/accounts"),
});

const unsplitTransactionsSchema = z.object({
    parent_ids: z
        .array(z.number())
        .describe("Array of parent transaction IDs to unsplit"),
    remove_parents: z
        .boolean()
        .optional()
        .describe("If true, delete parent transactions"),
});

const getTransactionGroupSchema = z.object({
    transaction_id: z.number().describe("ID of the transaction group"),
});

const createTransactionGroupSchema = z.object({
    date: z.string().describe("Date in YYYY-MM-DD format"),
    payee: z.string().describe("Payee name for the group"),
    category_id: z.number().optional().describe("Category ID for the group"),
    notes: z.string().optional().describe("Notes for the group"),
    tags: z
        .array(z.number())
        .optional()
        .describe("Array of tag IDs for the group"),
    transaction_ids: z
        .array(z.number())
        .describe("Array of transaction IDs to group"),
});

const deleteTransactionGroupSchema = z.object({
    transaction_id: z
        .number()
        .describe("ID of the transaction group to delete"),
});

export {
    getTransactionsSchema,
    getCategoryTotalsSchema,
    getSingleTransactionSchema,
    createTransactionsSchema,
    updateTransactionSchema,
    unsplitTransactionsSchema,
    getTransactionGroupSchema,
    createTransactionGroupSchema,
    deleteTransactionGroupSchema,
};
