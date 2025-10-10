import { z } from "zod";

export const getRecurringItemsSchema = z.object({
    start_date: z
        .string()
        .optional()
        .describe(
            "Start date in YYYY-MM-DD format. Defaults to first day of current month"
        ),
    end_date: z.string().optional().describe("End date in YYYY-MM-DD format"),
    debit_as_negative: z
        .boolean()
        .optional()
        .describe("Pass true to return debit amounts as negative"),
});
