import { sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

// ======= Base Tables =======

// Locations/Branches table
export const locations = sqliteTable('locations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  inventory: many(inventory),
  sales: many(sales),
  purchaseOrders: many(purchaseOrders),
}));

// ======= Product Management =======

// Categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id'), // Self-reference
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories, { relationName: 'parent' }),
  products: many(products),
}));

// Products table
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'),
  barcode: text('barcode'),
  categoryId: text('category_id').references(() => categories.id),
  purchasePrice: real('purchase_price').notNull().default(0),
  sellingPrice: real('selling_price').notNull().default(0),
  taxRate: real('tax_rate').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  inventory: many(inventory),
  saleItems: many(saleItems),
  purchaseOrderItems: many(purchaseOrderItems),
}));

// Product variants (for products with different sizes, colors, etc.)
export const productVariants = sqliteTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id),
  name: text('name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  purchasePrice: real('purchase_price'),
  sellingPrice: real('selling_price'),
  attributes: text('attributes', { mode: 'json' }).$type<Record<string, string>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventory: many(inventory),
  saleItems: many(saleItems),
  purchaseOrderItems: many(purchaseOrderItems),
}));

// ======= Inventory Management =======

// Inventory table
export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  locationId: text('location_id').notNull().references(() => locations.id),
  quantity: real('quantity').notNull().default(0),
  minQuantity: real('min_quantity').default(0), // For low stock alerts
  maxQuantity: real('max_quantity'), // For inventory management
  lastStockTake: integer('last_stock_take', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id],
  }),
  location: one(locations, {
    fields: [inventory.locationId],
    references: [locations.id],
  }),
  transactions: many(inventoryTransactions),
  alerts: many(inventoryAlerts),
}));

// Inventory transactions (stock movements)
export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  inventoryId: text('inventory_id').notNull().references(() => inventory.id),
  type: text('type', { enum: ['purchase', 'sale', 'adjustment', 'transfer', 'return'] }).notNull(),
  quantity: real('quantity').notNull(),
  previousQuantity: real('previous_quantity').notNull(),
  newQuantity: real('new_quantity').notNull(),
  reference: text('reference'), // Reference to a sale, purchase, etc.
  notes: text('notes'),
  userId: text('user_id').notNull(), // Reference to the user who made the transaction
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  inventory: one(inventory, {
    fields: [inventoryTransactions.inventoryId],
    references: [inventory.id],
  }),
}));

// Inventory alerts
export const inventoryAlerts = sqliteTable('inventory_alerts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  inventoryId: text('inventory_id').notNull().references(() => inventory.id),
  type: text('type', { enum: ['low_stock', 'out_of_stock', 'overstock', 'expiring'] }).notNull(),
  message: text('message').notNull(),
  isResolved: integer('is_resolved', { mode: 'boolean' }).default(false),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedById: text('resolved_by_id'), // User who resolved the alert
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const inventoryAlertsRelations = relations(inventoryAlerts, ({ one }) => ({
  inventory: one(inventory, {
    fields: [inventoryAlerts.inventoryId],
    references: [inventory.id],
  }),
}));

// ======= Sales Management =======

// Customers table
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  taxId: text('tax_id'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

// Sales/Orders table
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  locationId: text('location_id').notNull().references(() => locations.id),
  customerId: text('customer_id').references(() => customers.id),
  orderNumber: text('order_number').notNull(),
  status: text('status', { 
    enum: ['draft', 'completed', 'cancelled', 'refunded', 'partially_refunded'] 
  }).notNull().default('draft'),
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  userId: text('user_id').notNull(), // Cashier/employee who created the sale
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const salesRelations = relations(sales, ({ one, many }) => ({
  location: one(locations, {
    fields: [sales.locationId],
    references: [locations.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  items: many(saleItems),
  payments: many(payments),
}));

// Sale items (line items)
export const saleItems = sqliteTable('sale_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  saleId: text('sale_id').notNull().references(() => sales.id),
  productId: text('product_id').references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  name: text('name').notNull(), // Store name at time of sale
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  discountAmount: real('discount_amount').default(0),
  subtotal: real('subtotal').notNull(),
  total: real('total').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [saleItems.variantId],
    references: [productVariants.id],
  }),
}));

// Payments table
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  saleId: text('sale_id').notNull().references(() => sales.id),
  amount: real('amount').notNull(),
  method: text('method', { 
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'mobile_payment', 'other'] 
  }).notNull(),
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded'] }).notNull(),
  reference: text('reference'), // Transaction reference, receipt number, etc.
  notes: text('notes'),
  userId: text('user_id').notNull(), // User who processed the payment
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  sale: one(sales, {
    fields: [payments.saleId],
    references: [sales.id],
  }),
}));

// ======= Supplier Management =======

// Suppliers table
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  taxId: text('tax_id'),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

// Purchase orders
export const purchaseOrders = sqliteTable('purchase_orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  locationId: text('location_id').notNull().references(() => locations.id),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id),
  orderNumber: text('order_number').notNull(),
  status: text('status', { 
    enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'] 
  }).notNull().default('draft'),
  orderDate: integer('order_date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  expectedDeliveryDate: integer('expected_delivery_date', { mode: 'timestamp' }),
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  userId: text('user_id').notNull(), // User who created the purchase order
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  location: one(locations, {
    fields: [purchaseOrders.locationId],
    references: [locations.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

// Purchase order items
export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  purchaseOrderId: text('purchase_order_id').notNull().references(() => purchaseOrders.id),
  productId: text('product_id').references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  name: text('name').notNull(), // Store name at time of order
  quantity: real('quantity').notNull(),
  receivedQuantity: real('received_quantity').default(0),
  unitPrice: real('unit_price').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  subtotal: real('subtotal').notNull(),
  total: real('total').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [purchaseOrderItems.variantId],
    references: [productVariants.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;