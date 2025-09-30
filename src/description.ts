const getUserToolDescription = `
<usecase>Retrieves the authenticated user's account information, including their name, email, account ID, budget currency, and API key details. Use this when you need to confirm whose account you're working with, check the primary currency for budgets, or verify account settings before performing operations.</usecase>

<instructions>Returns a user object with account details. Call this at the start of a conversation to understand the account context. No parameters required.</instructions>

<response_guidance>After getting user details, you'll know the primary currency (budget_currency) which is important for budget and transaction operations. The account_id helps identify which account subsequent operations will affect.</response_guidance>`;

const getTransactionsToolDescription = `
<usecase>Retrieves transactions within a specified date range. Use this to analyze spending patterns, review recent purchases, find specific transactions, generate spending reports, or check account activity. This is your primary tool for accessing transaction data.</usecase>

<instructions>
Requires start_date and end_date (YYYY-MM-DD format). By default, automatically fetches ALL transactions in the date range using pagination (fetch_all=true). Returns simplified transaction objects with: id, date, category, payee, amount, currency, account name, and tags.

Optional filters: category_id, tag_id, asset_id, plaid_account_id, recurring_id, status (cleared/uncleared/pending), is_group.

For very large date ranges (6+ months), consider narrower windows or specific filters to reduce data volume.
</instructions>

<response_guidance>
Response includes total_count and whether all transactions were fetched. For spending analysis by category, use get_category_totals instead of processing individual transactions manually. For budget comparisons, combine with get_budget_summary.
</response_guidance>

`;

const getCategoryTotalsToolDescription = `
<usecase>Calculates spending totals grouped by category and subcategory within a date range. Use this for high-level spending analysis, budget vs actual comparisons, identifying spending patterns by category, or generating financial summaries. Much more efficient than manually summing transactions.</usecase>

<instructions>
Requires start_date and end_date (YYYY-MM-DD format). Automatically fetches and aggregates all matching transactions. Returns totals organized by category with subcategory breakdowns.

Optional: Provide category_id to get totals for just one category. Use plaid_account_id or asset_id to limit analysis to specific accounts.
</instructions>

<response_guidance>
Returns aggregated totals with category and subcategory breakdowns. For detailed transaction lists within categories, use get_transactions with category_id filter. For comparing against budgets, use get_budget_summary with the same date range.
</response_guidance>`;

const getSingleTransactionToolDescription = `
<usecase>Calculates spending totals grouped by category and subcategory within a date range. Use this for high-level spending analysis, budget vs actual comparisons, identifying spending patterns by category, or generating financial summaries. Much more efficient than manually summing transactions.</usecase>

<instructions>
Requires start_date and end_date (YYYY-MM-DD format). Automatically fetches and aggregates all matching transactions. Returns totals organized by category with subcategory breakdowns.

Optional: Provide category_id to get totals for just one category. Use plaid_account_id or asset_id to limit analysis to specific accounts.
</instructions>

<response_guidance>
Returns aggregated totals with category and subcategory breakdowns. For detailed transaction lists within categories, use get_transactions with category_id filter. For comparing against budgets, use get_budget_summary with the same date range.
</response_guidance>`;

const createTransactionToolDescription = `
<usecase>Creates one or more new transactions. Use this to manually log cash expenses, add missing transactions, import transactions from external sources, or record income. Supports bulk creation for efficiency.</usecase>

<instructions>
Requires array of transactions, each with: date (YYYY-MM-DD), payee, and amount (string with up to 4 decimals). Optional fields: category_id, asset_id, currency, notes, status, tags, recurring_id, external_id.

Options: apply_rules (auto-categorize), skip_duplicates (prevent doubles), check_for_recurring (link to recurring expenses), skip_balance_update (for manual accounts).
</instructions>

<response_guidance>
Response includes created transaction IDs. If skip_duplicates=true and duplicates are found, response indicates which were skipped. After creation, transactions appear in get_transactions results. For manual accounts (asset_id), the account balance updates unless skip_balance_update=true.
</response_guidance>

<errors>
"Missing required field": Ensure each transaction has date, payee, and amount.
"Invalid category_id": Category doesn't exist. Use get_all_categories to find valid IDs.
"Invalid asset_id": Asset doesn't exist. Use get_all_assets to find valid IDs.
"Invalid amount format": Amount must be string with max 4 decimal places (e.g., "123.4567").
</errors>`;

const updateTransactionToolDescription = `
<usecase>Modifies an existing transaction. Use this to correct mistakes, update categorization, add notes or tags, change amounts or dates, or adjust transaction metadata. Any field can be updated individually.</usecase>

<instructions>
Requires transaction_id and transaction object with fields to update. Only include fields you want to change - omitted fields remain unchanged. Updateable fields: date, payee, amount, category_id, asset_id, currency, notes, status, tags, recurring_id, external_id.
</instructions>

<response_guidance>
Response confirms the update. For manual accounts, balance is recalculated unless skip_balance_update=true. To verify changes, use get_single_transaction with the same transaction_id. If updating category, consider whether the transaction should be split instead - use create_transaction_group for multiple categories.
</response_guidance>

<errors>
"Transaction not found": Invalid transaction_id. Verify ID from get_transactions.
"Invalid category_id": Category doesn't exist. Use get_all_categories first.
"Cannot modify grouped transaction": Transaction is part of a group. Update the group instead using get_transaction_group, then update individual members if needed.
</errors>`;

const unsplitTransactionToolDescription = `
<usecase>Removes split relationships from transactions, converting split children back into independent transactions. Use this to undo splits that were created incorrectly or are no longer needed.</usecase>

<instructions>
Requires parent_ids array (IDs of parent transactions to unsplit). Optional: remove_parents=true to delete parent transactions after unsplitting (children become independent).
</instructions>

<response_guidance>
After unsplitting, child transactions become independent and appear as separate transactions in get_transactions. If remove_parents=false, parent transactions remain but children are no longer linked. If remove_parents=true, only the former child transactions remain.
</response_guidance>`;

const getTransactionGroupToolDescription = `
<usecase>Retrieves all transactions within a group, showing how multiple transactions are grouped together under a single parent. Use this to view grouped transactions, understand group composition, or before modifying grouped transactions.</usecase>

<instructions>
Requires transaction_id (the group ID, where is_group=true). Returns the parent group transaction plus all child transactions within the group.
</instructions>

<response_guidance>
Response includes the group transaction and its children array. To modify the entire group (payee, category, tags), update the parent transaction. To modify individual transactions within the group, update them separately using update_transaction. To ungroup, use delete_transaction_group.
</response_guidance>`;

const createTransactionGroupToolDescription = `
<usecase>Groups multiple independent transactions under a single parent transaction. Use this to organize related transactions (e.g., multiple purchases at the same store, trip expenses, project costs) for easier tracking and categorization.</usecase>

<instructions>
Requires: date (YYYY-MM-DD), payee, and transaction_ids array (transactions to group). Optional: category_id, notes, tags for the group.

All grouped transactions will share the group's payee, category, and tags, but retain their individual amounts and dates.
</instructions>

<response_guidance>
Response includes the new group ID. Grouped transactions now appear with group_id set and roll up under the parent. Use get_transaction_group to view the group. To ungroup later, use delete_transaction_group. The group's total amount equals the sum of all child transactions.
</response_guidance>

<errors>
"Transaction already in a group": One or more transaction_ids are already grouped. Ungroup them first using delete_transaction_group.
"Transaction not found": Invalid transaction_id in the array. Verify IDs using get_transactions.
</errors>`;

const deleteTransactionGroupToolDescription = `
<usecase>Deletes a transaction group or single transaction. For groups, removes the group relationship and optionally the transactions themselves. Use this to ungroup transactions or permanently delete transactions.</usecase>

<instructions>
Requires transaction_id. If the ID is a group (is_group=true), deletes the group and all child transactions. If it's a regular transaction, deletes just that transaction.

Warning: This permanently deletes data. To ungroup without deleting, use unsplit_transactions instead.
</instructions>

<response_guidance>
Deletion is permanent and cannot be undone. For groups, all child transactions are deleted along with the parent. To preserve child transactions while removing grouping, this is NOT the right tool - there's no option to keep children. Consider if you actually want to delete or just reorganize.
</response_guidance>

<errors>
"Transaction not found": Invalid transaction_id. Verify using get_transactions.
</errors>`;

export {
    getUserToolDescription,
    getTransactionsToolDescription,
    getCategoryTotalsToolDescription,
    getSingleTransactionToolDescription,
    createTransactionToolDescription,
    updateTransactionToolDescription,
    unsplitTransactionToolDescription,
    getTransactionGroupToolDescription,
    createTransactionGroupToolDescription,
    deleteTransactionGroupToolDescription,
};
