import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig } from "../config.js";
import { Category, CategoryChild } from "../types.js";
import {
    addCategoryToGroupToolDescription,
    createCategoryGroupToolDescription,
    createCategoryToolDescription,
    deleteCategoryToolDescription,
    forceDeleteCategoryToolDescription,
    getAllCategoriesToolDescription,
    getSingleCategoryToolDescription,
    updateCategoryToolDescription,
} from "../description.js";

export function registerCategoryTools(server: McpServer) {
    server.tool(
        "get_all_categories",
        getAllCategoriesToolDescription,
        {
            input: z.object({
                format: z
                    .string()
                    .optional()
                    .describe(
                        "Can either flattened or nested. If flattened, returns a singular array of categories, ordered alphabetically. If nested, returns top-level categories (either category groups or categories not part of a category group) in an array. Subcategories are nested within the category group under the property children."
                    ),
            }),
        },
        async ({ input }) => {
            const format = input.format || "flattened";
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const response = await fetch(
                `${baseUrl}/categories?format=${format}`,
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
                            text: `Failed to get all categories: ${response.statusText}`,
                        },
                    ],
                };
            }

            const data = await response.json();
            const categories: Category[] = data.categories || data;

            // Filter to essential category information only
            const minimalCategories = categories.map((category) => ({
                id: category.id,
                name: category.name,
                description: category.description,
                is_income: category.is_income,
                is_group: category.is_group,
                group_id: category.group_id,
                archived: category.archived,
                // For group categories, include simplified children
                ...(category.children && {
                    children: category.children.map((child) => ({
                        id: child.id,
                        name: child.name,
                        description: child.description,
                    })),
                }),
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            categories: minimalCategories,
                            count: minimalCategories.length,
                        }),
                    },
                ],
            };
        }
    );

    server.tool(
        "get_single_category",
        getSingleCategoryToolDescription,
        {
            input: z.object({
                categoryId: z
                    .string()
                    .describe(
                        "Id of the category to query. Should call the get_all_categories tool first to get the ids."
                    ),
            }),
        },
        async ({ input }) => {
            const { categoryId } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const response = await fetch(
                `${baseUrl}/categories/${categoryId}`,
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
                            text: `Failed to get single category: ${response.statusText}`,
                        },
                    ],
                };
            }

            const category: Category = await response.json();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(category),
                    },
                ],
            };
        }
    );

    server.tool(
        "create_category",
        createCategoryToolDescription,
        {
            input: z.object({
                name: z
                    .string()
                    .describe(
                        "Name of category. Must be between 1 and 40 characters."
                    ),
                description: z
                    .string()
                    .optional()
                    .default("")
                    .describe(
                        "Description of category. Must be less than 140 characters."
                    ),
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
            }),
        },
        async ({ input }) => {
            const {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                archived,
                group_id,
            } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const requestBody: any = {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                archived,
            };

            if (group_id !== undefined) {
                requestBody.group_id = group_id;
            }

            const response = await fetch(`${baseUrl}/categories`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${lunchmoneyApiToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create a single category: ${response.statusText}`,
                        },
                    ],
                };
            }

            const category: Category = await response.json();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(category),
                    },
                ],
            };
        }
    );

    server.tool(
        "create_category_group",
        createCategoryGroupToolDescription,
        {
            input: z.object({
                name: z
                    .string()
                    .describe(
                        "Name of category. Must be between 1 and 40 characters."
                    ),
                description: z
                    .string()
                    .optional()
                    .default("")
                    .describe(
                        "Description of category. Must be less than 140 characters."
                    ),
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
                category_ids: z
                    .array(z.number())
                    .optional()
                    .describe(
                        "Array of category_id to include in the category group."
                    ),
                new_categories: z
                    .array(z.string())
                    .optional()
                    .describe(
                        "Array of strings representing new categories to create and subsequently include in the category group."
                    ),
            }),
        },
        async ({ input }) => {
            const {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                category_ids,
                new_categories,
            } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const requestBody: any = {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                category_ids,
                new_categories,
            };

            if (category_ids && category_ids.length > 0) {
                requestBody.category_ids = category_ids;
            }

            if (new_categories && new_categories.length > 0) {
                requestBody.new_categories = new_categories;
            }

            const response = await fetch(`${baseUrl}/categories/group`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${lunchmoneyApiToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create a single category group: ${response.statusText}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(await response.json()),
                    },
                ],
            };
        }
    );

    server.tool(
        "update_category",
        updateCategoryToolDescription,
        {
            input: z.object({
                name: z
                    .string()
                    .describe(
                        "Name of category. Must be between 1 and 40 characters."
                    ),
                categoryId: z
                    .string()
                    .describe(
                        "Id of the category or category group to update. Execute the get_all_categories tool first, to get the category ids."
                    ),
                description: z
                    .string()
                    .optional()
                    .default("")
                    .describe(
                        "Description of category. Must be less than 140 characters."
                    ),
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
            }),
        },
        async ({ input }) => {
            const {
                name,
                categoryId,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                archived,
                group_id,
            } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const requestBody: any = {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                archived,
            };

            if (group_id !== undefined) {
                requestBody.group_id = group_id;
            }

            const response = await fetch(
                `${baseUrl}/categories/${categoryId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to update a single category: ${response.statusText}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(await response.json()),
                    },
                ],
            };
        }
    );

    server.tool(
        "add_to_category_group",
        addCategoryToGroupToolDescription,
        {
            input: z.object({
                group_id: z
                    .number()
                    .describe("Id of the parent group to add to."),
                category_ids: z
                    .array(z.number())
                    .optional()
                    .describe(
                        "Array of category_id to include in the category group."
                    ),
                new_categories: z
                    .array(z.string())
                    .optional()
                    .describe(
                        "Array of strings representing new categories to create and subsequently include in the category group."
                    ),
            }),
        },
        async ({ input }) => {
            const { group_id, category_ids, new_categories } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const requestBody: any = {};

            if (category_ids && category_ids.length > 0) {
                requestBody.category_ids = category_ids;
            }

            if (new_categories && new_categories.length > 0) {
                requestBody.new_categories = new_categories;
            }

            const response = await fetch(
                `${baseUrl}/categories/group/${group_id}/add`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${lunchmoneyApiToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to add to a single category group: ${response.statusText}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(await response.json()),
                    },
                ],
            };
        }
    );

    server.tool(
        "delete_category",
        deleteCategoryToolDescription,
        {
            input: z.object({
                category_id: z
                    .number()
                    .optional()
                    .describe(
                        "Id of the category or the category group to delete."
                    ),
            }),
        },
        async ({ input }) => {
            const { category_id } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const response = await fetch(
                `${baseUrl}/categories/${category_id}`,
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
                            text: `Failed to delete a single category or category group: ${response.statusText}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(await response.json()),
                    },
                ],
            };
        }
    );

    server.tool(
        "force_delete_category",
        forceDeleteCategoryToolDescription,
        {
            input: z.object({
                category_id: z
                    .number()
                    .optional()
                    .describe(
                        "Id of the category or the category group to delete."
                    ),
            }),
        },
        async ({ input }) => {
            const { category_id } = input;
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            const response = await fetch(
                `${baseUrl}/categories/${category_id}/force`,
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
                            text: `Failed to force delete a single category or category group: ${response.statusText}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(await response.json()),
                    },
                ],
            };
        }
    );
}
