import type { Category } from "@/database/schema";

// Dummy implementation for checking if a category exists
export async function onCheckCategoryExists(categoryName: string): Promise<boolean> {
  console.log(`Checking if category exists: ${categoryName}`);
  // Dummy implementation - returns false to allow creation of any category
  return false;
}

// Dummy implementation for creating a new category
export async function onCreateCategory(
  name: string,
  description: string
): Promise<Category> {
  console.log(`Creating category: ${name}, ${description}`);
  // Return a dummy category object with the provided name and description
  return {
    id: Math.floor(Math.random() * 10000).toString(),
    name,
    description,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Dummy implementation for getting all categories
export async function onGetCategories(): Promise<Category[]> {
  console.log('Getting all categories');
  // Return a dummy array with some sample categories
  return [
    {
      id: '1',
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Clothing',
      description: 'Apparel and fashion items',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Books',
      description: 'Books and publications',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}
