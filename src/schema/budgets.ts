import { z } from "zod";

const getBudgetSummarySchema = z.object({
    start_date: z
        .string()
        .describe(
            "Start date in YYYY-MM-DD format. Lunch Money currently only supports monthly budgets, so your date should be the start of a month (eg. 2021-04-01)"
        ),
    end_date: z
        .string()
        .describe(
            "End date in YYYY-MM-DD format. Lunch Money currently only supports monthly budgets, so your date should be the end of a month (eg. 2021-04-30)"
        ),
    currency: z
        .string()
        .optional()
        .describe("Currency for budget (defaults to primary currency)"),
});

const upsertBudgetSchema = z.object({
    start_date: z
        .string()
        .describe("Budget month start date in YYYY-MM-DD format"),
    category_id: z.number().describe("Category ID for the budget"),
    amount: z.number().describe("Budget amount"),
    currency: z
        .string()
        .optional()
        .describe("Currency for budget (defaults to primary currency)"),
});

const removeBudgetSchema = z.object({
    start_date: z
        .string()
        .describe("Budget month start date in YYYY-MM-DD format"),
    category_id: z.number().describe("Category ID for the budget to remove"),
});

export { getBudgetSummarySchema, upsertBudgetSchema, removeBudgetSchema };
