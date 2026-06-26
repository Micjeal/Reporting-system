# Bugfix Requirements Document

## Introduction

The Route Sales Management System has a critical backend/frontend architecture mismatch that prevents agents from creating sales transactions. The frontend was refactored to support multi-product sales (sending an array of items with payment_method), but the backend still expects single-product sales data. This causes TypeScript errors, runtime errors, and prevents the sales creation feature from functioning.

**Impact:** Agents cannot create any sales transactions, blocking a core business function.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the frontend sends a multi-product sale request with `payment_method` field THEN the backend throws a TypeScript error "'payment_method' does not exist in type"

1.2 WHEN the frontend sends a multi-product sale request with an `items` array THEN the backend fails to process the request because it expects single-product fields (`product_id`, `quantity`, `amount`)

1.3 WHEN the frontend sends `sale_date` field THEN the backend fails to map it because it expects `date` field

1.4 WHEN the frontend sends multiple products in one transaction THEN the backend cannot store them because the `sales` table has `product_id`, `quantity`, and `amount` columns (single-product schema)

1.5 WHEN the page component `/agent/sales/new/page.tsx` is loaded THEN Next.js throws runtime error "The default export is not a React Component" because the component is not exported as default

### Expected Behavior (Correct)

2.1 WHEN the frontend sends a multi-product sale request with `payment_method` field THEN the backend SHALL accept and store the payment method in the `sales` table

2.2 WHEN the frontend sends a multi-product sale request with an `items` array containing multiple products THEN the backend SHALL create one transaction-level record in `sales` table and multiple line items in `sale_items` table

2.3 WHEN the frontend sends `sale_date` field THEN the backend SHALL correctly map it to the appropriate field in the database

2.4 WHEN the frontend sends multiple products in one transaction THEN the backend SHALL store transaction-level data (customer, payment, date) in `sales` table and individual product details in `sale_items` table

2.5 WHEN the page component `/agent/sales/new/page.tsx` is loaded THEN Next.js SHALL render the component successfully with proper default export

2.6 WHEN creating a multi-product sale THEN the backend SHALL validate inventory availability for each product in the transaction

2.7 WHEN creating a multi-product sale THEN the backend SHALL maintain data integrity by using database transactions (all items succeed or all fail)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN existing single-product sales data is queried THEN the system SHALL CONTINUE TO return the data correctly without breaking existing reports or displays

3.2 WHEN inventory validation fails for any product THEN the system SHALL CONTINUE TO reject the entire sale and return a clear error message

3.3 WHEN an agent without proper permissions attempts to create a sale THEN the system SHALL CONTINUE TO enforce authentication and authorization checks

3.4 WHEN a sale is created successfully THEN the system SHALL CONTINUE TO create an audit log entry

3.5 WHEN sales are filtered by date range or agent THEN the system SHALL CONTINUE TO return filtered results correctly

3.6 WHEN the GET /api/sales endpoint is called THEN the system SHALL CONTINUE TO return sales data in the expected format for existing consumers
