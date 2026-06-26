# Requirements Document: Multi-Product Sales Feature

## Introduction

The Multi-Product Sales feature extends the agent sales system to enable agents to create sales transactions containing multiple products in a single operation. Currently, agents can only sell one product per transaction. This feature maintains backward compatibility with existing single-product sales while introducing batch creation capabilities with comprehensive validation and audit logging.

The system must support agents in efficiently processing bulk sales, managing inventory constraints across multiple products, and maintaining complete audit trails for all batch operations.

## Glossary

- **Agent**: A user with sales authority who creates sales transactions
- **Batch Sale**: A single transaction containing multiple line items (products)
- **Line Item**: A single product entry within a batch sale, including quantity, price, and adjustments
- **Product**: An item available for sale with a unit price and inventory tracking
- **Issued Inventory**: The total quantity of a product allocated to an agent
- **Inventory Availability**: The remaining quantity of a product that can be sold (issued - already sold)
- **Batch ID**: Unique identifier for a multi-product sale transaction
- **Sale Record**: Individual database entry for a single product sale
- **Audit Log**: System record of all batch creation operations
- **Atomicity**: All-or-nothing guarantee that either all line items in a batch are created or none are created
- **Validation**: Process of checking that data meets specified constraints before processing
- **Returns Amount**: Quantity or value of products returned or adjusted for a line item
- **Adjustments Amount**: Additional monetary adjustments applied to a line item

## Requirements

### Requirement 1: Multi-Product Sale Creation

**User Story:** As an agent, I want to create a sales transaction with multiple products, so that I can efficiently process bulk sales in a single operation.

#### Acceptance Criteria

1. WHEN an agent accesses the sales creation interface THEN the system SHALL display a form that supports adding multiple products
2. WHEN an agent adds a product to the sale THEN the system SHALL display the product in a line items list with fields for quantity, unit price, returns amount, and adjustments amount
3. WHEN an agent adds multiple products THEN the system SHALL allow adding up to 50 products in a single batch
4. WHEN an agent removes a product from the line items THEN the system SHALL remove that product from the batch and recalculate totals
5. WHEN an agent modifies the quantity for a line item THEN the system SHALL recalculate the total amount for that line item as quantity multiplied by unit price
6. WHEN an agent submits a batch sale THEN the system SHALL create individual sale records for each line item in a single atomic transaction

### Requirement 2: Product Selection and Management

**User Story:** As an agent, I want to select products from an available catalog, so that I can build accurate sales transactions.

#### Acceptance Criteria

1. WHEN an agent clicks to add a product THEN the system SHALL display a product selector showing available products with their unit prices and current inventory levels
2. WHEN an agent selects a product THEN the system SHALL add that product to the line items list with the current unit price from the product master
3. WHEN a product is already in the line items THEN the system SHALL prevent adding the same product twice and display a warning message
4. WHEN an agent searches for a product THEN the system SHALL filter the product list by name or identifier
5. WHEN the product selector is open THEN the system SHALL exclude products already added to the current batch from the available selection

### Requirement 3: Inventory Validation

**User Story:** As the system, I want to validate inventory availability before creating sales, so that agents cannot oversell products.

#### Acceptance Criteria

1. WHEN an agent submits a batch sale THEN the system SHALL validate that the total quantity for each product does not exceed the issued inventory for that agent
2. WHEN inventory is insufficient for any product THEN the system SHALL reject the batch and display an error message identifying which products have insufficient inventory
3. WHEN inventory is insufficient THEN the system SHALL display the required quantity and available quantity for each product with insufficient inventory
4. WHEN an agent modifies a quantity in a line item THEN the system SHALL perform client-side inventory validation and display warnings before submission
5. WHEN inventory availability changes between client validation and server submission THEN the system SHALL perform authoritative server-side validation and reject the batch if inventory is no longer available

### Requirement 4: Line Item Calculations and Totals

**User Story:** As the system, I want to accurately calculate line item and batch totals, so that agents have confidence in the financial accuracy of their sales.

#### Acceptance Criteria

1. WHEN a line item is created or modified THEN the system SHALL calculate the total amount as quantity multiplied by unit price
2. WHEN line items are added or removed THEN the system SHALL recalculate the batch total amount as the sum of all line item total amounts
3. WHEN line items are added or removed THEN the system SHALL recalculate the batch total quantity as the sum of all line item quantities
4. WHEN line items contain returns amounts THEN the system SHALL calculate the batch total returns as the sum of all line item returns amounts
5. WHEN the form is displayed THEN the system SHALL show a summary section displaying batch total amount, total quantity, and total returns
6. WHEN a line item is modified THEN the system SHALL update all batch totals immediately without requiring form resubmission

### Requirement 5: Batch Constraints and Limits

**User Story:** As the system, I want to enforce batch size constraints, so that the system remains performant and manageable.

#### Acceptance Criteria

1. WHEN an agent attempts to create a batch sale THEN the system SHALL require at least one line item in the batch
2. WHEN an agent attempts to add more than 50 products to a batch THEN the system SHALL prevent the addition and display an error message
3. WHEN a batch reaches 50 line items THEN the system SHALL disable the add product button and display a message indicating the maximum has been reached
4. WHEN an agent attempts to submit a batch with zero line items THEN the system SHALL display a validation error and prevent submission
5. WHEN an agent attempts to submit a batch with more than 50 line items THEN the system SHALL display a validation error and prevent submission

### Requirement 6: Form Validation and Error Handling

**User Story:** As the system, I want to validate all form data before submission, so that invalid data does not reach the database.

#### Acceptance Criteria

1. WHEN a line item has a quantity of zero or negative THEN the system SHALL display a validation error for that line item
2. WHEN a line item has a non-integer quantity THEN the system SHALL display a validation error for that line item
3. WHEN a line item has a negative unit price THEN the system SHALL display a validation error for that line item
4. WHEN a line item has a negative returns amount THEN the system SHALL display a validation error for that line item
5. WHEN a line item has a negative adjustments amount THEN the system SHALL display a validation error for that line item
6. WHEN the sale date is not in valid YYYY-MM-DD format THEN the system SHALL display a validation error
7. WHEN the batch total amount does not equal the sum of line item amounts THEN the system SHALL display a validation error
8. WHEN any validation error exists THEN the system SHALL disable the submit button and display all validation errors

### Requirement 7: Batch Sale API Endpoint

**User Story:** As a developer, I want a dedicated API endpoint for batch sales, so that I can create multiple sales in a single request.

#### Acceptance Criteria

1. WHEN a POST request is sent to /api/sales/batch with valid line items THEN the system SHALL create individual sale records for each line item
2. WHEN the batch API receives a request THEN the system SHALL validate all line items before creating any records
3. WHEN all line items are valid and inventory is available THEN the system SHALL create all sale records in a single atomic database transaction
4. WHEN the batch API successfully creates sales THEN the system SHALL return a 201 response with a batch ID and all created sale records
5. WHEN the batch API receives invalid data THEN the system SHALL return a 400 response with a descriptive error message
6. WHEN the batch API receives a request from an unauthenticated user THEN the system SHALL return a 401 response
7. WHEN the batch API receives a request from an unauthorized user THEN the system SHALL return a 403 response
8. WHEN the batch API encounters a server error THEN the system SHALL return a 500 response and rollback all database changes

### Requirement 8: Atomic Transaction Processing

**User Story:** As the system, I want to ensure batch sales are processed atomically, so that the database never contains partial batches.

#### Acceptance Criteria

1. WHEN a batch sale is submitted THEN the system SHALL begin a database transaction before creating any sale records
2. WHEN all line items are successfully created THEN the system SHALL commit the transaction and return success
3. WHEN any line item creation fails THEN the system SHALL rollback the entire transaction and no sale records shall be created
4. WHEN a database error occurs during batch creation THEN the system SHALL rollback the transaction and return an error response
5. WHEN a batch is successfully created THEN the system SHALL create an audit log entry for the batch creation

### Requirement 9: Audit Logging

**User Story:** As an administrator, I want to track all batch sales operations, so that I can maintain compliance and investigate issues.

#### Acceptance Criteria

1. WHEN a batch sale is successfully created THEN the system SHALL create an audit log entry with the batch ID
2. WHEN a batch sale is created THEN the audit log entry SHALL include the agent ID who created the batch
3. WHEN a batch sale is created THEN the audit log entry SHALL include all line items with product IDs and quantities
4. WHEN a batch sale is created THEN the audit log entry SHALL include the timestamp of creation
5. WHEN a batch sale is created THEN the audit log entry SHALL include the action type as "sales.batch.create"
6. WHEN a batch sale creation fails THEN the system SHALL create an audit log entry recording the failure and reason

### Requirement 10: Authorization and Security

**User Story:** As the system, I want to ensure only authorized agents can create sales, so that sales data remains secure and accurate.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to create a batch sale THEN the system SHALL reject the request and return a 401 error
2. WHEN an authenticated user attempts to create a batch sale THEN the system SHALL verify the user is an agent with sales authority
3. WHEN an agent creates a batch sale THEN the system SHALL set the agent_id in all sale records to the authenticated agent's ID
4. WHEN an agent attempts to create a sale with a different agent_id THEN the system SHALL reject the request and return a 403 error
5. WHEN a batch sale is created THEN the system SHALL validate all input data on the server to prevent injection attacks
6. WHEN text fields contain special characters THEN the system SHALL sanitize the input before storing in the database

### Requirement 11: Backward Compatibility

**User Story:** As the system, I want to maintain existing single-product sales functionality, so that existing workflows continue to work.

#### Acceptance Criteria

1. WHEN an agent uses the existing single-product sales endpoint THEN the system SHALL continue to process sales as before
2. WHEN the batch sales feature is deployed THEN the existing /api/sales endpoint SHALL remain unchanged
3. WHEN an agent views the sales dashboard THEN the system SHALL display both single-product and batch sales in the transaction history
4. WHEN the database is queried for sales THEN the system SHALL return both single-product and batch sales without distinction
5. WHEN existing sales records are queried \THEN the system SHALL return them with all existing fields intact

### Requirement 12: User Interface and Experience

**User Story:** As an agent, I want a clear and intuitive interface for creating multi-product sales, so that I can efficiently manage batch transactions.

#### Acceptance Criteria

1. WHEN the multi-product sales form is displayed THEN the system SHALL show a line items table with columns for product name, quantity, unit price, and total amount
2. WHEN the form is displayed \THEN the system SHALL show a summary section with batch totals (total amount, total quantity, total returns)
3. WHEN an agent hovers over a line item \THEN the system SHALL display options to edit or remove the line item
4. WHEN an agent clicks to edit a line item \THEN the system SHALL display inline editing controls for quantity, returns amount, and adjustments amount
5. WHEN a batch is being submitted \THEN the system SHALL display a loading indicator and disable the submit button
6. WHEN a batch is successfully created \THEN the system SHALL display a success message with the batch ID and redirect to the sales dashboard
7. WHEN a batch creation fails \THEN the system SHALL display an error message with the reason for failure and allow the agent to retry

### Requirement 13: Performance and Scalability

**User Story:** As the system, I want to handle batch sales efficiently, so that performance remains acceptable as usage grows.

#### Acceptance Criteria

1. WHEN a batch sale with 50 line items is submitted \THEN the system SHALL process the request within 30 seconds
2. WHEN inventory validation is performed \THEN the system SHALL check all products in a single query or minimal queries
3. WHEN the product selector is opened \THEN the system SHALL load the product list within 2 seconds
4. WHEN line items exceed 20 items \THEN the system SHALL virtualize the line items table to maintain UI responsiveness
5. WHEN inventory availability changes \THEN the system SHALL debounce validation checks to prevent excessive database queries

### Requirement 14: Data Persistence and Recovery

**User Story:** As an agent, I want my work to be preserved, so that I don't lose data if something goes wrong.

#### Acceptance Criteria

1. WHEN an agent is filling out a batch sale form \THEN the system MAY save draft data to local storage
2. WHEN a batch sale is successfully created \THEN the system SHALL persist all sale records to the database
3. WHEN a batch sale creation fails \THEN the system SHALL preserve the form data so the agent can retry
4. WHEN the browser is closed \THEN the system SHALL preserve draft data in local storage for recovery

### Requirement 15: Reporting and Analytics

**User Story:** As an administrator, I want to track batch sales separately, so that I can analyze bulk sales patterns.

#### Acceptance Criteria

1. WHEN sales data is queried for reporting \THEN the system SHALL include a batch_id field for batch sales
2. WHEN batch sales are displayed in reports \THEN the system SHALL group line items by batch_id
3. WHEN a batch is displayed in reports \THEN the system SHALL show the total amount, total quantity, and creation timestamp
4. WHEN filtering sales by date \THEN the system SHALL include batch sales created on that date

## Constraints and Limitations

### Functional Constraints

1. **Batch Size**: Maximum 50 products per batch sale
2. **Minimum Batch Size**: Minimum 1 product per batch sale
3. **Product Uniqueness**: Each product can appear only once per batch (no duplicate products)
4. **Inventory Constraint**: Total quantity sold for a product cannot exceed issued inventory for that agent
5. **Date Format**: Sale dates must be in YYYY-MM-DD format
6. **Quantity Constraint**: Quantities must be positive integers
7. **Price Constraint**: Unit prices must be non-negative numbers

### Non-Functional Constraints

1. **Performance**: Batch submission must complete within 30 seconds
2. **Availability**: Batch API must maintain 99.9% uptime
3. **Data Consistency**: All batch operations must be atomic (all-or-nothing)
4. **Audit Trail**: All batch operations must be logged for compliance
5. **Security**: All input must be validated and sanitized on the server

### System Constraints

1. **Database**: Uses existing sales, inventory, products, and agents tables
2. **Authentication**: Requires existing authentication middleware
3. **Authorization**: Uses existing role-based access control
4. **API Framework**: Uses existing API route structure and middleware

## Dependencies and Assumptions

### External Dependencies

1. **Frontend Libraries**:
   - react-hook-form: Form state management
   - zod: Schema validation
   - @hookform/resolvers/zod: Form validation integration
   - lucide-react: UI icons
   - Existing UI component library

2. **Backend Libraries**:
   - zod: Request validation
   - @supabase/supabase-js: Database client
   - Existing authentication middleware
   - Existing audit logging service

3. **Database**:
   - Existing sales table
   - Existing inventory table
   - Existing products table
   - Existing agents table

### Assumptions

1. **Product Data**: Product unit prices are maintained in the products table and do not change during a batch creation
2. **Inventory Data**: Inventory availability is accurately tracked in the inventory table
3. **Agent Data**: All agents have a valid agent_id in the agents table
4. **Authentication**: Users are authenticated before accessing the batch sales API
5. **Network**: Network connectivity is stable during batch submission
6. **Database**: Database is available and responsive during batch operations
7. **Backward Compatibility**: Existing single-product sales will continue to work without modification

## Use Cases and User Stories

### Use Case 1: Agent Creates Multi-Product Sale

**Actor**: Sales Agent

**Preconditions**:
- Agent is authenticated and logged in
- Agent has sales authority
- Multiple products are available in inventory

**Main Flow**:
1. Agent navigates to the sales creation page
2. Agent clicks "Add Product" button
3. System displays product selector modal
4. Agent searches for and selects Product A
5. System adds Product A to line items with unit price
6. Agent enters quantity of 10 for Product A
7. Agent clicks "Add Product" again
8. Agent selects Product B
9. System adds Product B to line items
10. Agent enters quantity of 5 for Product B
11. Agent reviews batch summary showing total amount and quantity
12. Agent clicks "Submit Batch"
13. System validates all line items and inventory
14. System creates sale records for both products in a single transaction
15. System displays success message with batch ID
16. Agent is redirected to sales dashboard

**Postconditions**:
- Two sale records are created in the database
- Batch ID is generated and stored
- Audit log entry is created
- Agent sees batch in sales history

### Use Case 2: Agent Encounters Inventory Shortage

**Actor**: Sales Agent

**Preconditions**:
- Agent is creating a batch sale
- Product A has only 30 units of issued inventory
- Agent has already sold 20 units

**Main Flow**:
1. Agent adds Product A to batch with quantity 15
2. System performs client-side validation and shows available inventory (10 units)
3. Agent modifies quantity to 15 (exceeding available inventory)
4. System displays warning that only 10 units are available
5. Agent clicks "Submit Batch"
6. System performs server-side inventory validation
7. System detects insufficient inventory (need 15, have 10)
8. System rejects batch and displays error message
9. Agent reduces quantity to 10
10. Agent resubmits batch
11. System validates successfully and creates sale record

**Postconditions**:
- Sale record is created with quantity 10
- Inventory is updated to reflect the sale

### Use Case 3: Agent Prevents Duplicate Product

**Actor**: Sales Agent

**Preconditions**:
- Agent is creating a batch sale
- Product A is already in the line items

**Main Flow**:
1. Agent clicks "Add Product"
2. System displays product selector
3. Agent searches for and selects Product A (already in batch)
4. System displays warning: "Product A is already in this sale"
5. System prevents adding the duplicate
6. Agent can increase the quantity of existing Product A instead

**Postconditions**:
- No duplicate product is added
- Agent can modify existing line item quantity

### Use Case 4: Administrator Reviews Batch Sales Audit Log

**Actor**: Administrator

**Preconditions**:
- Administrator is logged in
- Batch sales have been created

**Main Flow**:
1. Administrator navigates to audit logs
2. Administrator filters by action type "sales.batch.create"
3. System displays all batch creation events
4. Administrator clicks on a batch entry
5. System displays batch details including all line items, agent ID, and timestamp
6. Administrator can verify the batch was created correctly

**Postconditions**:
- Administrator has visibility into all batch operations
- Compliance requirements are met

## Acceptance Criteria Summary

The Multi-Product Sales feature is complete when:

1. ✓ Agents can add multiple products to a single sale transaction
2. ✓ System validates inventory availability for all products before creation
3. ✓ All line items in a batch are created atomically (all-or-nothing)
4. ✓ Batch totals are calculated accurately and displayed to agents
5. ✓ Maximum 50 products per batch is enforced
6. ✓ Duplicate products in a batch are prevented
7. ✓ All batch operations are logged for audit purposes
8. ✓ Existing single-product sales continue to work without changes
9. ✓ API endpoint /api/sales/batch is implemented and functional
10. ✓ Form validation prevents invalid data from reaching the database
11. ✓ Authorization ensures only authenticated agents can create sales
12. ✓ Performance meets 30-second submission requirement
13. ✓ Error messages clearly communicate issues to agents
14. ✓ Batch sales appear in sales dashboard and reports
15. ✓ All requirements are testable and verifiable
