import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig } from "../config.js";
import { Category } from "../types.js";
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
import {
    addToCategoryGroupSchema,
    createCategoryGroupSchema,
    createCategorySchema,
    deleteCategorySchema,
    forceDeleteCategorySchema,
    getAllCategoriesSchema,
    getSingleCategorySchema,
    updateCategorySchema,
} from "../schema/categories.js";

export function registerCategoryTools(server: McpServer) {
    server.registerTool(
        "get_all_categories",
        {
            title: "Get All Categories",
            description: getAllCategoriesToolDescription,
            inputSchema: getAllCategoriesSchema.shape,
        },
        async (args) => {
            const format = args.format || "flattened";
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get all categories: ${
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
        "get_single_category",
        {
            title: "Get Single Category",
            description: getSingleCategoryToolDescription,
            inputSchema: getSingleCategorySchema.shape,
        },
        async (args) => {
            const { categoryId } = args;
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to get single category: ${
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
        "create_category",
        {
            title: "Create Category",
            description: createCategoryToolDescription,
            inputSchema: createCategorySchema.shape,
        },
        async (args) => {
            const {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                archived,
                group_id,
            } = args;
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

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create a single category: ${
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
        "create_category_group",
        {
            title: "Create Category Group",
            description: createCategoryGroupToolDescription,
            inputSchema: createCategoryGroupSchema.shape,
        },
        async (args) => {
            const {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                category_ids,
                new_categories,
            } = args;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const requestBody: any = {
                name,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
            };

            if (category_ids && category_ids.length > 0) {
                requestBody.category_ids = category_ids;
            }

            if (new_categories && new_categories.length > 0) {
                requestBody.new_categories = new_categories;
            }

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create a single category group: ${
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
        "update_category",
        {
            title: "Update Category",
            description: updateCategoryToolDescription,
            inputSchema: updateCategorySchema.shape,
        },
        async (args) => {
            const {
                name,
                categoryId,
                description,
                is_income,
                exclude_from_budget,
                exclude_from_totals,
                archived,
                group_id,
            } = args;
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

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to update a single category: ${
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
        "add_to_category_group",
        {
            title: "Add to Category Group",
            description: addCategoryToGroupToolDescription,
            inputSchema: addToCategoryGroupSchema.shape,
        },
        async (args) => {
            const { group_id, category_ids, new_categories } = args;
            const { baseUrl, lunchmoneyApiToken } = getConfig();
            const requestBody: any = {};

            if (category_ids && category_ids.length > 0) {
                requestBody.category_ids = category_ids;
            }

            if (new_categories && new_categories.length > 0) {
                requestBody.new_categories = new_categories;
            }

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to add to a single category group: ${
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
        "delete_category",
        {
            title: "Delete Category",
            description: deleteCategoryToolDescription,
            inputSchema: deleteCategorySchema.shape,
        },
        async (args) => {
            const { category_id } = args;
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to delete a single category or category group: ${
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
        "force_delete_category",
        {
            title: "Force Delete Category",
            description: forceDeleteCategoryToolDescription,
            inputSchema: forceDeleteCategorySchema.shape,
        },
        async (args) => {
            const { category_id } = args;
            const { baseUrl, lunchmoneyApiToken } = getConfig();

            try {
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
                        isError: true,
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
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to force delete a single category or category group: ${
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
