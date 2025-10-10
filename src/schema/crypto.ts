import { z } from "zod";

export const getAllCryptoSchema = z.object({});

export const updateManualCryptoSchema = z.object({
    crypto_id: z.number().describe("ID of the crypto asset to update"),
    balance: z
        .number()
        .optional()
        .describe("Updated balance of the crypto asset"),
});
