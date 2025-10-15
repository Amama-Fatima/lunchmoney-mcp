const getUserToolDescription = `
<usecase>Retrieves the authenticated user's account information, including their name, email, account ID, budget currency, and API key details. Use this when you need to confirm whose account you're working with, check the primary currency for budgets, or verify account settings before performing operations.</usecase>

<instructions>Returns a user object with account details. Call this at the start of a conversation to understand the account context. No parameters required.</instructions>

<response_guidance>After getting user details, you will know the primary currency (budget_currency) which is important for budget and transaction operations. The account_id helps identify which account subsequent operations will affect.</response_guidance>`;

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
<usecase>
PRIMARY USE: Calculating net profit, total income, and total expenses for a date range. This is THE tool for answering questions like "what's my net profit for [month]?" or "show me income vs expenses for [period]".

Also used for: High-level spending analysis, budget vs actual comparisons, identifying spending patterns by category, or generating financial summaries. Much more efficient than manually summing transactions.
</usecase>

<instructions>
Requires start_date and end_date (YYYY-MM-DD format). Automatically fetches and aggregates all matching transactions. Returns totals organized by category with subcategory breakdowns.

Optional: Provide category_id to get totals for just one category. Use plaid_account_id or asset_id to limit analysis to specific accounts.
</instructions>

<response_guidance>
Returns aggregated totals with category and subcategory breakdowns. Categories with negative totals are income, positive totals are expenses. Sum all negative values for total income, sum all positive values for total expenses, then calculate net profit as (income - expenses).

For detailed transaction lists within categories, use get_transactions with category_id filter. For comparing against budgets, use get_budget_summary with the same date range.
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

const getAllAssetsToolDescription = `
<usecase>Retrieves all manually-managed assets in the account. Use this to view net worth, check account balances, see available accounts for transactions, or get asset IDs needed for other operations. Assets include cash accounts, credit cards, investments, loans, vehicles, real estate, and more.</usecase>

<instructions>
No parameters required. Returns simplified asset list with: id, name, display_name, type, subtype, balance, currency, institution, and closed status. Balance shown in asset's currency with to_base conversion rate for primary currency calculations.
</instructions>

<response_guidance>
Use asset IDs from this response when creating or filtering transactions. For Plaid-connected accounts (automatic sync), use get_all_plaid_accounts instead - those are not included here. To add a new manual account, use create_asset. Closed assets (closed_on set) are included but typically excluded from active transaction workflows.
</response_guidance>`;

const createAssetToolDescription = `
<usecase>Creates a new manually-managed asset account. Use this to track cash accounts, credit cards, loans, investments, vehicles, real estate, or any asset/liability not connected via Plaid. Essential for logging transactions to manual accounts.</usecase>

<instructions>
Required: type_name (cash, credit, investment, real estate, loan, vehicle, cryptocurrency, employee compensation, other liability, other asset), name, and balance (current amount).

Optional: subtype_name (checking, savings, retirement, etc.), display_name (shown in UI), institution_name, currency (defaults to account primary), balance_as_of (timestamp), exclude_transactions (hide from transaction dropdowns).

Common types:
- cash/credit: Daily spending accounts
- loan: Mortgages, auto loans (balance is amount owed)
- investment: Brokerage, retirement accounts
- vehicle/real estate: Physical assets
</instructions>

<response_guidance>
Response includes the new asset_id - save this for transaction creation using create_transactions with asset_id parameter. The asset now appears in get_all_assets results. For accounts that support automatic syncing, consider connecting via Plaid instead using get_all_plaid_accounts.
</response_guidance>

<errors>
"Invalid type_name": Must be one of the exact enum values listed. Common mistake: using "checking" as type instead of "cash" with subtype "checking".
"Balance required": All assets need an initial balance, even if 0.
</errors>`;

const updateAssetToolDescription = `
<usecase>Updates an existing manually-managed asset. Use this to correct account details, update balances, change account names/types, mark accounts as closed, or adjust institution information. Balance updates are common for manual account reconciliation.</usecase>

<instructions>
Required: asset_id (from get_all_assets). All other fields optional - only include what you want to change.

Updateable: type_name, subtype_name, name, display_name, balance, balance_as_of, currency, institution_name, closed_on, exclude_transactions.

To close an account: Set closed_on to closing date (YYYY-MM-DD). To reopen: Set closed_on to null.
</instructions>

<response_guidance>
Balance updates don't automatically create transactions - they adjust the asset balance directly. For proper accounting, create a transaction using create_transactions instead, which updates balance AND creates a transaction record. Use direct balance updates only for corrections or reconciliation. After closing an account (closed_on set), it won't appear in transaction creation dropdowns.
</response_guidance>

<errors>
"Asset not found": Invalid asset_id. Use get_all_assets to find correct ID.
"Cannot modify Plaid asset": This asset is synced via Plaid. Disconnect from Plaid first or use get_all_plaid_accounts to manage it.
</errors>`;

const getBudgetSummaryToolDescription = `
<usecase>Retrieves budget data for a date range, showing budgeted amounts vs actual spending by category and month. Use this to track budget performance, identify overspending, analyze spending trends against goals, or generate budget reports. Essential for budget vs actual analysis.</usecase>

<instructions>
Requires start_date and end_date in YYYY-MM-DD format. IMPORTANT: Dates must align with month boundaries (start: first day of month like 2024-03-01, end: last day of month like 2024-03-31). Budgets are monthly only.

Returns budget data by category including: budgeted amount, actual spending, and monthly breakdown in the 'data' field. Shows both individual categories and category groups (is_group=true).
</instructions>

<response_guidance>
The 'data' field contains month-by-month breakdown with budget_amount, spending_to_base, and num_transactions. Compare budget_amount vs spending_to_base to identify over/under budget categories. For detailed transaction lists within over-budget categories, use get_transactions with category_id filter. To see spending totals without budget context, use get_category_totals instead.
</response_guidance>

<errors>
"Invalid date range": Dates must be month boundaries. Use 2024-03-01 to 2024-03-31, not 2024-03-05 to 2024-03-28.
"No budgets found": No budgets exist for this date range. Use upsert_budget to create budgets first.
</errors>
`;

const upsertBudgetToolDescription = `
<usecase>Creates a new budget or updates an existing budget for a category and month. Use this to set spending limits, establish financial goals, create monthly budgets, or adjust existing budget amounts. "Upsert" means it creates if new, updates if exists.</usecase>

<instructions>
Required: start_date (first day of month in YYYY-MM-DD format, e.g., 2024-03-01), category_id (from get_all_categories), amount (budget limit as number).

Optional: currency (defaults to account primary currency).

The budget applies to the entire month starting from start_date. To set budgets for multiple months, call this tool once per month.
</instructions>

<response_guidance>
Budget is immediately active for the specified month. Use get_budget_summary with the same month to verify the budget was set correctly and see actual spending against it. To set budgets for multiple categories at once, call this tool multiple times. Budget amounts should be positive numbers representing spending limits.
</response_guidance>

<errors>
"Invalid category_id": Category doesn't exist. Use get_all_categories to find valid category IDs.
"Invalid start_date": Must be the first day of a month (YYYY-MM-01 format), not mid-month dates.
"Invalid amount": Amount must be a positive number. Use 0 for zero-budget categories.
</errors>
`;

const removeBudgetToolDescription = `
<usecase>Deletes a budget for a specific category and month. Use this to remove budget limits that are no longer needed, clear incorrect budgets, or stop tracking certain categories. This does not affect transactions, only the budget target.</usecase>

<instructions>
Required: start_date (first day of month in YYYY-MM-DD format, e.g., 2024-03-01), category_id (from get_all_categories).

Removes only the budget for that specific category and month. Does not affect budgets for other months or categories. Does not delete transactions in that category.
</instructions>

<response_guidance>
Budget is permanently removed. The category still exists and its transactions remain unchanged - only the budget target is deleted. To verify removal, use get_budget_summary for that month and confirm the category no longer appears. To change a budget amount instead of removing it, use upsert_budget with the new amount.
</response_guidance>

<errors>
"Budget not found": No budget exists for this category_id and start_date combination. Verify both values using get_budget_summary.
"Invalid category_id": Category doesn't exist. Use get_all_categories to find valid IDs.
</errors>
`;

const getAllCategoriesToolDescription = `
<usecase>Retrieves all spending and income categories in the account. Use this to see available categories for transactions, get category IDs for filtering/budgeting, understand category structure, or list categories for user selection. Categories organize all financial activity.</usecase>

<instructions>
Optional format parameter: "flattened" (default, alphabetical list) or "nested" (shows category groups with children).

Returns: id, name, description, is_income, is_group, group_id, archived status. For nested format, category groups include children array with subcategories.

Use flattened for simple category lists or finding specific categories. Use nested to understand hierarchical organization and see which categories belong to groups.
</instructions>

<response_guidance>
Save category IDs from this response - required for create_transactions, update_transaction, get_category_totals, upsert_budget, and filtering operations. Categories with is_group=true are parent groups containing other categories. Categories with group_id are children within a group and inherit properties from their parent. Archived categories still exist but typically shouldn't be used for new transactions.
</response_guidance>`;

const getSingleCategoryToolDescription = `
<usecase>Retrieves detailed information about one specific category. Use this to check category properties before updates, verify inheritance from parent groups, or see complete category configuration including budget/total exclusions.</usecase>

<instructions>
Requires categoryId (string, from get_all_categories). Returns full category details including: name, description, is_income, is_group, group_id, exclude_from_budget, exclude_from_totals, archived status.

Important: If the category is part of a group (has group_id), properties like is_income, exclude_from_budget, and exclude_from_totals are inherited from the parent group and cannot be changed at the child level.
</instructions>

<response_guidance>
Check is_group to determine if this is a parent group or regular category. If group_id is set, the category inherits behavior from its parent - use get_single_category on the parent to see inherited properties. Use this before update_category to understand current state.
</response_guidance>
`;

const createCategoryToolDescription = `
<usecase>Creates a new category for organizing transactions. Use this to add new spending/income categories, create specialized categories for tracking, or build custom categorization schemes. Categories are essential for financial organization and reporting.</usecase>

<instructions>
Required: name (1-40 characters).

Optional settings:
- description (max 140 characters): Explain category purpose
- is_income (default false): Mark as income category
- exclude_from_budget (default false): Hide from budget tracking
- exclude_from_totals (default false): Exclude from spending summaries
- archived (default false): Create as archived (rarely used)
- group_id: Place category inside existing category group

Common patterns:
- Spending categories: is_income=false (default)
- Income categories: is_income=true
- Transfer categories: exclude_from_budget=true, exclude_from_totals=true
</instructions>

<response_guidance>
Response includes new category_id - use this for categorizing transactions with create_transactions or update_transaction. Category immediately appears in get_all_categories. To create multiple related categories at once, consider create_category_group with new_categories parameter instead.
</response_guidance>

<errors>
"Name too long": Maximum 40 characters. Shorten category name.
"Category already exists": A category with this exact name already exists. Use a different name or update the existing category.
"Invalid group_id": Group doesn't exist. Use get_all_categories with format=nested to find valid group IDs.
</errors>
`;

const createCategoryGroupToolDescription = `
<usecase>Creates a category group that contains multiple related categories. Use this to organize categories hierarchically (e.g., "Transportation" containing "Gas", "Parking", "Uber"), simplify budget management for related expenses, or apply settings to multiple categories at once.</usecase>

<instructions>
Required: name (1-40 characters).

Optional:
- description, is_income, exclude_from_budget, exclude_from_totals: Applied to entire group and inherited by children
- category_ids: Array of existing category IDs to move into this group
- new_categories: Array of category name strings to create and add to group

You can create an empty group and add categories later using add_to_category_group, or populate it immediately using category_ids and/or new_categories.
</instructions>

<response_guidance>
Response includes new group_id. All categories in the group inherit the group's is_income, exclude_from_budget, and exclude_from_totals settings. Use get_all_categories with format=nested to see the group structure. To add more categories later, use add_to_category_group with the group_id.
</response_guidance>

<errors>
"Category already in a group": One of the category_ids is already in another group. Categories can only belong to one group at a time. Remove from current group first.
</errors>
`;

const updateCategoryToolDescription = `
<usecase>Modifies an existing category or category group. Use this to rename categories, change category settings, move categories between groups, archive unused categories, or update descriptions.</usecase>

<instructions>
Required: categoryId (from get_all_categories) and name.

Optional: description, is_income, exclude_from_budget, exclude_from_totals, archived, group_id.

To move category to different group: Provide new group_id.
To remove category from group: Set group_id to null.
To archive category: Set archived=true (hides from active use but preserves history).

Important: If updating a category that's inside a group, it inherits is_income, exclude_from_budget, and exclude_from_totals from the parent group - these cannot be set at child level.
</instructions>

<response_guidance>
Changes apply immediately to all future transactions and reports. Existing transactions keep their category assignment. After renaming, the new name appears throughout the system. Archiving doesn't delete the category but removes it from transaction dropdowns. Use get_single_category to verify changes.
</response_guidance>

<errors>
"Category not found": Invalid categoryId. Use get_all_categories to find correct ID.
"Name already exists": Another category has this name. Choose a unique name.
"Cannot modify inherited properties": This category is in a group. Properties like is_income are inherited from the parent group and must be changed at the group level.
</errors>
`;

const addCategoryToGroupToolDescription = `
<usecase>Adds categories to an existing category group. Use this to organize existing categories under a group, create new categories within a group, or restructure category hierarchy by moving categories into groups.</usecase>

<instructions>
Required: group_id (from get_all_categories where is_group=true).

Provide at least one of:
- category_ids: Array of existing category IDs to add to group
- new_categories: Array of category name strings to create and add to group

Can use both parameters together to add existing and create new categories in one operation.
</instructions>

<response_guidance>
Added categories immediately inherit the group's is_income, exclude_from_budget, and exclude_from_totals settings. Use get_all_categories with format=nested to verify the group structure. Categories moved into the group lose any conflicting individual settings and adopt group settings instead.
</response_guidance>

<errors>
"Group not found": Invalid group_id. Use get_all_categories with format=nested to find category groups (is_group=true).
"Category already in a group": One of the category_ids is already in another group. Categories can only belong to one group. Remove from current group first using update_category with group_id=null.
"Category not found": Invalid category_id in the array. Use get_all_categories to find valid IDs.
</errors>
`;

const deleteCategoryToolDescription = `
<usecase>Safely attempts to delete a category or category group. Use this to remove unused categories while ensuring no data loss. This is a "safe delete" that fails if the category has dependencies, showing you what needs to be handled first.</usecase>

<instructions>
Requires category_id. Attempts to delete the category or category group.

This will FAIL if the category has:
- Existing transactions using this category
- Active budgets for this category
- Recurring expenses using this category
- Other dependencies

When it fails, response shows what dependencies exist and how many, so you can decide how to proceed.
</instructions>

<response_guidance>
If deletion fails due to dependencies, you have two options:

1. Handle dependencies manually: Recategorize transactions, remove budgets, then retry delete_category
2. Force delete: Use force_delete_category to delete category and remove it from all transactions/budgets (irreversible)

Always try delete_category first to avoid accidental data changes. For category groups, all child categories must also have no dependencies.
</response_guidance>

<errors>
"Cannot delete - has dependencies": Category is in use. Response lists what's using it (e.g., "150 transactions, 3 budgets"). Recategorize transactions and remove budgets first, or use force_delete_category if you want to uncategorize everything.
</errors>
`;

const forceDeleteCategoryToolDescription = `
<usecase>Permanently deletes a category or category group and removes it from all transactions, budgets, and recurring items. Use this only when you're certain you want to remove a category and uncategorize everything using it. This is irreversible.</usecase>

<instructions>
Requires category_id.

DANGER: This permanently:
- Deletes the category
- Uncategorizes all transactions using this category (they become uncategorized)
- Removes all budgets for this category
- Disassociates from all recurring items
- Cannot be undone

ALWAYS try delete_category first to see what will be affected. Only use force_delete_category when you understand and accept the consequences.
</instructions>

<response_guidance>
After force deletion, all affected transactions become uncategorized. Check transaction history and recategorize if needed using update_transaction. Budgets for this category are permanently removed. For category groups, all child categories are also deleted and their transactions uncategorized. This operation cannot be reversed.
</response_guidance>

<errors>
"Category not found": Invalid category_id. Verify ID using get_all_categories.
</errors>
`;

const getAllCryptoToolDescription = `
<usecase>Retrieves all cryptocurrency holdings tracked in the account, including both manually-managed and exchange-synced crypto assets. Use this to view crypto portfolio, check current holdings and values, calculate net worth including crypto, or get crypto_id values needed for updates.</usecase>

<instructions>
No parameters required. Returns complete crypto asset list with: id, name, display_name, balance (quantity of coins/tokens), currency (crypto symbol like BTC, ETH), current market value in base currency, institution_name (exchange or wallet), and sync status (manual vs automatic).

Includes both:
- Manually-tracked assets: Wallets you update yourself
- Exchange-synced assets: Automatically updated from connected exchanges
</instructions>

<response_guidance>
For manually-managed crypto (where source indicates manual tracking), use update_manual_crypto to update balances after transfers or purchases. For exchange-synced assets, balances update automatically - manual updates will fail. Market values are calculated using current exchange rates. To see how crypto fits into overall net worth, combine with get_all_assets for complete financial picture.
</response_guidance>
`;

const updateManualCryptoToolDescription = `
<usecase>Updates the balance of a manually-tracked cryptocurrency asset. Use this after transferring crypto to/from wallets, making purchases or sales through non-synced exchanges, or correcting balance discrepancies in manual holdings.</usecase>

<instructions>
Required: crypto_id (from get_all_crypto).
Optional: balance (new quantity of coins/tokens as number).

IMPORTANT: This only works for manually-managed crypto assets. Exchange-synced crypto updates automatically and cannot be manually modified.

Balance represents the quantity of coins/tokens held (e.g., 0.5 BTC, 10.25 ETH), not the fiat value. Market value is calculated automatically using current exchange rates.
</instructions>

<response_guidance>
Balance updates immediately. Market value recalculates based on current exchange rates. This does NOT create a transaction record - it only adjusts the balance. For proper accounting of crypto purchases/sales, consider creating transactions using create_transactions with the asset_id instead. Use this tool primarily for reconciliation or correcting manual tracking errors.
</response_guidance>

<errors>
"Crypto asset not found": Invalid crypto_id. Use get_all_crypto to find correct ID.
"Cannot update synced asset": This crypto asset is synced from an exchange and updates automatically. Manual balance updates are not allowed for exchange-synced holdings.
"Invalid balance": Balance must be a positive number representing quantity of coins/tokens held.
</errors>
`;

const getAllPlaidAccountsToolDescription = `
<usecase>Retrieves all bank accounts connected via Plaid for automatic transaction syncing. Use this to view connected accounts, check account balances, see sync status, identify accounts for transaction filtering, or troubleshoot connection issues. Plaid accounts sync automatically unlike manual assets.</usecase>

<instructions>
No parameters required. Returns accounts with: id, name, display_name, type (depository/credit/loan/investment), subtype (checking/savings/credit card/etc), mask (last 4 digits), institution_name, status (connection health), balance, currency, credit limit (for credit cards).

These are DIFFERENT from manual assets (get_all_assets). Plaid accounts sync transactions automatically from banks. Manual assets require manual transaction entry.
</instructions>

<response_guidance>
Use plaid_account_id from these results to filter transactions with get_transactions. Check status field for connection health - "good" means syncing properly, other values indicate connection issues that may need re-authentication. Balances update automatically during syncs. If accounts are missing or balances seem outdated, use trigger_plaid_fetch to force a refresh.
</response_guidance>

`;

const triggerPlaidFetchToolDescription = `
<usecase>Manually triggers Plaid to fetch the latest transactions and balances from connected banks. Use this when you need current data immediately, suspect transactions are missing, or want to verify recent activity before the next automatic sync.</usecase>

<instructions>
No parameters required. Initiates fetch from all connected Plaid accounts.

IMPORTANT: This is EXPERIMENTAL and may take up to 5 minutes to complete. The fetch happens asynchronously - this tool returns immediately but data updates gradually over the next few minutes.

Do not call this repeatedly - wait at least 5 minutes between fetch requests.
</instructions>

<response_guidance>
After triggering, wait 3-5 minutes then use get_transactions to see newly fetched transactions. Not all banks provide real-time data - some have delays even after fetching. If accounts still show outdated data after 5 minutes, there may be a connection issue - check get_all_plaid_accounts for status. Plaid normally syncs automatically every few hours, so manual triggers are only needed for immediate updates.
</response_guidance>

<errors>
"Rate limit exceeded": You've triggered fetches too frequently. Wait at least 5 minutes between requests.
"Plaid connection error": One or more accounts have authentication issues. Check get_all_plaid_accounts for status and re-authenticate problematic accounts through the Lunch Money web interface.
</errors>
`;

const getRecurringItemsToolDescription = `
<usecase>Retrieves expected recurring expenses and income for a date range, showing which recurring items should occur and which transactions are missing. Use this to track subscription payments, verify recurring bills were paid, identify missing expected transactions, forecast upcoming recurring expenses, or reconcile regular income/expenses.</usecase>

<instructions>
Optional parameters:
- start_date (YYYY-MM-DD): Defaults to first day of current month if omitted
- end_date (YYYY-MM-DD): Last day to check for recurring items
- debit_as_negative: Return expense amounts as negative numbers

Returns recurring item templates with: id, payee, amount, category, recurrence pattern (granularity: monthly/weekly/yearly and quantity), start_date, end_date, and critically: missing_dates_within_range (dates when expected transaction didn't occur) and matched_transactions_count (how many were found).
</instructions>

<response_guidance>
Check missing_dates_within_range to identify recurring expenses that haven't been paid yet or may have been missed. If missing dates exist, you may want to:
1. Use get_transactions to verify the transaction doesn't exist
2. Create the missing transaction using create_transactions with the recurring_id to link it
3. Investigate if the recurring expense was cancelled or payment method changed

For recurring items with matched_transactions_count matching expected occurrences, everything is on track. This is particularly useful for subscription audits, bill payment verification, and cash flow forecasting.
</response_guidance>

<errors>
"No recurring items found": No recurring expenses/income are configured. Set these up in the Lunch Money web interface first.
"Invalid date range": Ensure dates are in YYYY-MM-DD format and start_date is before end_date.
</errors>
`;

const getAllTagsToolDescription = `
<usecase>Retrieves all tags used for organizing and labeling transactions. Use this to see available tags for filtering, get tag IDs needed for transaction operations, understand your tagging system, or identify tags for analysis and reporting. Tags provide flexible cross-category organization (e.g., "business", "vacation", "tax-deductible").</usecase>

<instructions>
No parameters required. Returns complete tag list with: id, name, description, and archived status.

Tags work alongside categories to provide multi-dimensional transaction organization. While categories answer "what type of expense?", tags answer "what context?" - allowing one transaction to have multiple tags but only one category.
</instructions>

<response_guidance>
Save tag IDs from this response - needed for create_transactions (tags parameter as array of IDs), update_transaction, get_transactions filtering (tag_id parameter), and create_transaction_group. Use tags to track cross-cutting concerns like tax deductions, business expenses, specific projects, trips, or any custom organizational scheme. To add tags to existing transactions, use update_transaction with the tags array. Archived tags still exist in historical data but typically shouldn't be used for new transactions.
</response_guidance>
`;

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
    getAllAssetsToolDescription,
    createAssetToolDescription,
    updateAssetToolDescription,
    getBudgetSummaryToolDescription,
    upsertBudgetToolDescription,
    removeBudgetToolDescription,
    getAllCategoriesToolDescription,
    getSingleCategoryToolDescription,
    createCategoryToolDescription,
    createCategoryGroupToolDescription,
    updateCategoryToolDescription,
    addCategoryToGroupToolDescription,
    deleteCategoryToolDescription,
    forceDeleteCategoryToolDescription,
    getAllCryptoToolDescription,
    updateManualCryptoToolDescription,
    getAllPlaidAccountsToolDescription,
    triggerPlaidFetchToolDescription,
    getRecurringItemsToolDescription,
    getAllTagsToolDescription,
};
