import { z } from "zod";

const getAllCategoriesSchema = z.object({
    format: z
        .string()
        .optional()
        .describe(
            "Can either flattened or nested. If flattened, returns a singular array of categories, ordered alphabetically. If nested, returns top-level categories (either category groups or categories not part of a category group) in an array. Subcategories are nested within the category group under the property children."
        ),
});

const getSingleCategorySchema = z.object({
    categoryId: z
        .string()
        .describe(
            "Id of the category to query. Should call the get_all_categories tool first to get the ids."
        ),
});

const baseCategorySchema = {
    name: z
        .string()
        .describe("Name of category. Must be between 1 and 40 characters."),
    description: z
        .string()
        .optional()
        .default("")
        .describe("Description of category. Must be less than 140 characters."),
    is_income: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            "Whether or not transactions in this category should be treated as income."
        ),
    exclude_from_budget: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            "Whether or not transactions in this category should be excluded from budgets."
        ),
    exclude_from_totals: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            "Whether or not transactions in this category should be excluded from calculated totals."
        ),
};

const createCategorySchema = z.object({
    ...baseCategorySchema,
    archived: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether or not category should be archived."),
    group_id: z
        .number()
        .optional()
        .describe(
            "Assigns the newly-created category to an existing category group."
        ),
});

const createCategoryGroupSchema = z.object({
    ...baseCategorySchema,
    category_ids: z
        .array(z.number())
        .optional()
        .describe("Array of category_id to include in the category group."),
    new_categories: z
        .array(z.string())
        .optional()
        .describe(
            "Array of strings representing new categories to create and subsequently include in the category group."
        ),
});

const updateCategorySchema = z.object({
    ...baseCategorySchema,
    categoryId: z
        .string()
        .describe(
            "Id of the category or category group to update. Execute the get_all_categories tool first, to get the category ids."
        ),
    archived: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether or not category should be archived."),
    group_id: z
        .number()
        .optional()
        .describe(
            "Assigns the newly-created category to an existing category group."
        ),
});

const addToCategoryGroupSchema = z.object({
    group_id: z.number().describe("Id of the parent group to add to."),
    category_ids: z
        .array(z.number())
        .optional()
        .describe("Array of category_id to include in the category group."),
    new_categories: z
        .array(z.string())
        .optional()
        .describe(
            "Array of strings representing new categories to create and subsequently include in the category group."
        ),
});

const deleteCategorySchema = z.object({
    category_id: z
        .number()
        .optional()
        .describe("Id of the category or the category group to delete."),
});

const forceDeleteCategorySchema = z.object({
    category_id: z
        .number()
        .optional()
        .describe("Id of the category or the category group to delete."),
});

export {
    getAllCategoriesSchema,
    getSingleCategorySchema,
    createCategorySchema,
    createCategoryGroupSchema,
    updateCategorySchema,
    addToCategoryGroupSchema,
    deleteCategorySchema,
    forceDeleteCategorySchema,
    baseCategorySchema,
};
