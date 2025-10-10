import { z } from "zod";

const assetTypeEnum = z.enum([
    "cash",
    "credit",
    "investment",
    "real estate",
    "loan",
    "vehicle",
    "cryptocurrency",
    "employee compensation",
    "other liability",
    "other asset",
]);

const getAllAssetsSchema = z.object({});

const createAssetSchema = z.object({
    type_name: assetTypeEnum.describe("Primary type of the asset"),
    subtype_name: z
        .string()
        .optional()
        .describe("Optional subtype (e.g., retirement, checking, savings)"),
    name: z.string().describe("Name of the asset"),
    display_name: z
        .string()
        .optional()
        .describe("Display name of the asset (defaults to name)"),
    balance: z.number().describe("Current balance of the asset"),
    balance_as_of: z
        .string()
        .optional()
        .describe("Date/time the balance is as of in ISO 8601 format"),
    currency: z
        .string()
        .optional()
        .describe("Three-letter currency code (defaults to primary currency)"),
    institution_name: z
        .string()
        .optional()
        .describe("Name of the institution holding the asset"),
    closed_on: z
        .string()
        .optional()
        .describe("Date the asset was closed in YYYY-MM-DD format"),
    exclude_transactions: z
        .boolean()
        .optional()
        .describe("Whether to exclude this asset from transaction options"),
});

const updateAssetSchema = z.object({
    asset_id: z.number().describe("ID of the asset to update"),
    type_name: assetTypeEnum.optional().describe("Primary type of the asset"),
    subtype_name: z
        .string()
        .optional()
        .describe("Optional subtype (e.g., retirement, checking, savings)"),
    name: z.string().optional().describe("Name of the asset"),
    display_name: z.string().optional().describe("Display name of the asset"),
    balance: z.number().optional().describe("Current balance of the asset"),
    balance_as_of: z
        .string()
        .optional()
        .describe("Date/time the balance is as of in ISO 8601 format"),
    currency: z.string().optional().describe("Three-letter currency code"),
    institution_name: z
        .string()
        .optional()
        .describe("Name of the institution holding the asset"),
    closed_on: z
        .string()
        .optional()
        .describe("Date the asset was closed in YYYY-MM-DD format"),
    exclude_transactions: z
        .boolean()
        .optional()
        .describe("Whether to exclude this asset from transaction options"),
});

export { getAllAssetsSchema, createAssetSchema, updateAssetSchema };
