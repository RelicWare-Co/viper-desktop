import {
  Button,
  Text,
  Flex,
  Modal,
  Pagination,
  Table,
  TextInput,
  Select,
  ActionIcon,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/database/schema";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { onCheckCategoryExists, onCreateCategory, onGetCategories } from "./categories.telefunc";

export const Route = createFileRoute("/categories/")({
  component: Categories,
});

function Categories() {
  const [createModalOpened, { open, close }] = useDisclosure(false);

  // Fetch categories data using react-query
  const { data: categoriesData, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: onGetCategories,
  });

  const categories = categoriesData || [];

  const columnHelper = createColumnHelper<Category>();

  const columns = [
    columnHelper.accessor("name", {
      header: "Category Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("description", {
      header: "Category Description",
      cell: (info) => info.getValue(),
    }),
  ];

  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const createCategoryForm = useForm({
    initialValues: {
      categoryName: "",
      categoryDescription: "",
    },
    validate: {
      categoryName: (value: string) =>
        value.trim().length === 0 ? "Category name is required" : null,
      categoryDescription: (value: string) =>
        value.trim().length === 0 ? "Category description is required" : null,
    },
  });

  const handleCreateCategory = async (values: {
    categoryName: string;
    categoryDescription: string;
  }) => {
    try {
      const categoryExists = await onCheckCategoryExists(values.categoryName);

      if (categoryExists) {
        notifications.show({
          title: "Categoría duplicada",
          message: `La categoría "${values.categoryName}" ya existe`,
          color: "yellow",
          autoClose: 5000,
        });
        return;
      }

      const category = await onCreateCategory(
        values.categoryName,
        values.categoryDescription
      );
      console.log(category);

      notifications.show({
        title: "Categoría creada",
        message: `La categoría "${values.categoryName}" ha sido creada exitosamente`,
        color: "green",
        autoClose: 5000,
      });
      refetch();
    } catch (error) {
      console.log("Failed to create category:", error);

      notifications.show({
        title: "Error",
        message: "No se pudo crear la categoría. Por favor intente nuevamente",
        color: "red",
        autoClose: 5000,
      });
    }
    createCategoryForm.reset();
    close();
  };

  return (
    <>
      <div>
        <h1>Categories</h1>
        <Button onClick={open}>Create new category</Button>
        <Button
          onClick={() =>
            onGetCategories().then((categories) => console.log(categories))
          }
        >
          Get Categories
        </Button>
      </div>

      <Table>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
          {/* <Table.Tr>
            <Table.Th>Category Name</Table.Th>
            <Table.Th>Category Description</Table.Th>
          </Table.Tr> */}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
          {/* {categories.map((category) => (
            <Table.Tr key={category.id}>
              <Table.Td>{category.name}</Table.Td>
              <Table.Td>{category.description}</Table.Td>
            </Table.Tr>
          ))} */}
        </Table.Tbody>
      </Table>

      {/* Controles de paginación */}
      <Flex justify="space-between" align="center" mt="md">
        <Flex gap="xs" align="center">
          <Text size="sm">Página</Text>
          <ActionIcon size="sm">
          {table.getState().pagination.pageIndex + 1}
          </ActionIcon>
          <Text size="sm">de </Text>
          <ActionIcon size="sm">
          {table.getPageCount()}
          </ActionIcon>
        </Flex>

        <Pagination
          total={table.getPageCount()}
          value={table.getState().pagination.pageIndex + 1}
          onChange={(newPage) => table.setPageIndex(newPage - 1)}
        />

        <Flex gap="xs" align="center">
          <Text size="sm">Filas por página:</Text>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onChange={(value) => {
              if (value) {
                table.setPageSize(Number(value));
              }
            }}
            data={["5", "10", "20", "30", "40", "50"]}
            styles={{ root: { width: 65 } }}
          />
        </Flex>
      </Flex>

      <Modal
        opened={createModalOpened}
        onClose={close}
        title="Create new category"
      >
        <form onSubmit={createCategoryForm.onSubmit(handleCreateCategory)}>
          <TextInput
            label="Category name"
            placeholder="Category name"
            {...createCategoryForm.getInputProps("categoryName")}
          />

          <TextInput
            label="Category description"
            placeholder="Category description"
            {...createCategoryForm.getInputProps("categoryDescription")}
          />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </>
  );
}
