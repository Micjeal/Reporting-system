# Multi-Product Sales Feature - Design Document

## Overview

The Multi-Product Sales feature enables agents to create batch sales transactions containing 1-50 products in a single operation. This feature streamlines bulk sales processing while maintaining inventory validation, individual line item management, and comprehensive audit logging.

## Architecture

### Core Components

1. **Batch Sales API Endpoint**
   - POST /api/sales/batch
   - Accepts batch requests with multiple line items
   - Returns transaction confirmation with batch ID

2. **Line Item Management**
   - Individual pricing per product
   - Return tracking per line item
   - Quantity validation against inventory

3. **Inventory Validation Layer**
   - Real-time inventory checks for each product
   - Prevents overselling
   - Atomic transaction handling

4. **Audit Logging System**
   - Logs all batch operations
   - Tracks inventory changes
   - Records error conditions

## Technical Approach

### Batch Processing

- **Batch Size**: 1-50 products per batch
- **Atomicity**: All items in a batch succeed or fail together
- **Idempotency**: Duplicate batch requests are detected and rejected
- **Transaction Model**: Database transactions ensure consistency

### Line Item Structure

Each line item contains:
- Product ID (unique within batch)
- Quantity
- Unit Price
- Return Quantity (optional, defaults to 0)
- Line Item Total (calculated: quantity × unit_price)

### Inventory Validation

- Validates available inventory before processing
- Checks for duplicate products in batch
- Prevents negative inventory
- Supports inventory reservations during processing

### Error Handling Strategy

1. **Inventory Errors**
   - Insufficient stock for product
   - Product not found
   - Negative quantity requested

2. **Batch Validation Errors**
   - Batch size exceeds 50 items
   - Batch size is 0 items
   - Duplicate product IDs in batch
   - Invalid pricing (negative or zero)

3. **Data Validation Errors**
   - Missing required fields
   - Invalid data types
   - Malformed request structure

4. **Recovery Paths**
   - Partial batch rejection with detailed error reporting
   - Rollback on transaction failure
   - Retry-safe error responses

### Security Considerations

- Agent authentication required
- Authorization check: agents can only create sales for their assigned territory
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- Rate limiting on batch endpoint

### Audit Logging

- Log batch creation with agent ID and timestamp
- Log inventory changes per product
- Log all validation failures
- Log successful batch completion with transaction ID
- Maintain immutable audit trail

## Data Model

### Batch Sales Request

```
{
  "agentId": string,
  "lineItems": [
    {
      "productId": string,
      "quantity": number,
      "unitPrice": number,
      "returnQuantity": number (optional)
    }
  ]
}
```

### Batch Sales Response

```
{
  "batchId": string,
  "status": "success" | "partial_failure" | "failure",
  "transactionId": string,
  "lineItems": [
    {
      "productId": string,
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number,
      "status": "success" | "failed",
      "error": string (optional)
    }
  ],
  "totalAmount": number,
  "timestamp": ISO8601,
  "errors": [
    {
      "code": string,
      "message": string,
      "details": object
    }
  ]
}
```

## Constraints and Limitations

- Maximum 50 products per batch
- Minimum 1 product per batch
- Prices must be positive (> 0)
- Quantities must be positive integers
- Return quantities cannot exceed sale quantities
- Duplicate product IDs not allowed in single batch
- Batch processing is synchronous (response includes full result)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Batch Creation and ID Generation

For any valid batch request with 1-50 line items, the system SHALL create a transaction and return a unique Batch_ID.

**Validates: Requirement 1.1**

### Property 2: Line Item Calculation

For any line item with quantity Q and unit price P, the Line_Total SHALL equal Q × P.

**Validates: Requirements 1.2, 7.2, 8.2**

### Property 3: Return Quantity Validation

For any line item, the Return_Quantity cannot exceed the sale quantity, and both must be non-negative integers.

**Validates: Requirement 1.3**

### Property 4: Batch Size Enforcement

For any batch request, if the number of line items is 0 or greater than 50, the system SHALL reject the batch with the appropriate validation error.

**Validates: Requirements 1.4, 1.5**

### Property 5: Idempotency

For any duplicate batch request submitted within 5 minutes (same Agent_ID, same Product_IDs, same quantities), the system SHALL return the same Batch_ID and Transaction_ID without creating duplicate transactions or modifying inventory.

**Validates: Requirements 1.6, 12.2, 12.3, 12.4**

### Property 6: Batch Atomicity on Success

For any valid batch request with multiple line items, when all items pass validation, the system SHALL decrement inventory for each product by the sale quantity and commit all changes together.

**Validates: Requirement 2.1**

### Property 7: Batch Atomicity on Failure

For any batch request where any line item fails validation, the system SHALL reject the entire batch without modifying any inventory.

**Validates: Requirement 2.2**

### Property 8: Duplicate Product Detection

For any batch request containing duplicate Product_IDs, the system SHALL reject the entire batch with error code DUPLICATE_PRODUCTS.

**Validates: Requirement 2.3**

### Property 9: Inventory Shortage Detection

For any line item requesting a quantity greater than available inventory, the system SHALL reject that line item with error code INSUFFICIENT_INVENTORY.

**Validates: Requirement 3.1**

### Property 10: Product Existence Validation

For any line item referencing a Product_ID that does not exist, the system SHALL reject that line item with error code PRODUCT_NOT_FOUND.

**Validates: Requirement 3.2**

### Property 11: Inventory Non-Negativity

For any successful batch, the inventory for each product SHALL never become negative after decrementing by the sale quantity.

**Validates: Requirement 3.5**

### Property 12: Missing Required Fields Validation

For any batch request with missing required fields, the system SHALL reject it with error code INVALID_REQUEST.

**Validates: Requirement 4.3**

### Property 13: Audit Log Completeness

For any batch operation, an audit log entry SHALL be created containing Agent_ID, Batch_ID, timestamp, and operation status.

**Validates: Requirement 5.1**

### Property 14: Audit Log Failure Recording

For any failed batch, the audit log SHALL record the failure reason, error code, and error details.

**Validates: Requirement 5.2**

### Property 15: Audit Log Inventory Changes

For any inventory modification by a batch, the audit log SHALL record the Product_ID, quantity change, and Transaction_ID.

**Validates: Requirement 5.3**

### Property 16: Audit Log Timestamp Format

For all audit log entries, the timestamp SHALL be in ISO8601 format.

**Validates: Requirement 5.5**

### Property 17: Successful Response Structure

For any successfully processed batch, the system SHALL return HTTP 200 with Batch_ID, Transaction_ID, and total amount.

**Validates: Requirement 6.1**

### Property 18: Error Response Structure

For any failed batch, the system SHALL return HTTP 400 with error code and descriptive error message.

**Validates: Requirement 6.2**

### Property 19: Validation Error Response

For any batch request with validation errors, the system SHALL return HTTP 422 with validation errors for each invalid field.

**Validates: Requirement 6.3**

### Property 20: Response Completeness

For any batch response, the response SHALL include status, Transaction_ID, timestamp, and line item details for each product.

**Validates: Requirement 6.5**

### Property 21: Line Item Storage

For any line item added to a batch, the system SHALL store the Product_ID, quantity, Unit_Price, and Return_Quantity.

**Validates: Requirement 7.1**

### Property 22: Line Item Status Reporting

For any batch response, the system SHALL include the status (success or failed) for each line item.

**Validates: Requirement 7.3**

### Property 23: Line Item Error Reporting

For any line item that fails validation, the system SHALL include the error code and error message in the response.

**Validates: Requirement 7.4**

### Property 24: Multi-Item Processing

For any batch containing multiple line items, the system SHALL process all items and report individual status for each.

**Validates: Requirement 7.5**

### Property 25: Response Total Amount

For any batch response, the total amount SHALL equal the sum of all Line_Totals.

**Validates: Requirement 8.2**

### Property 26: Response Timestamp Format

For any batch response, the timestamp SHALL be in ISO8601 format.

**Validates: Requirement 8.3**

### Property 27: Error Array Structure

For any batch containing errors, the response SHALL include an errors array with code, message, and details for each error.

**Validates: Requirement 8.4**

### Property 28: Required Field Presence

For any batch request, the system SHALL validate that all required fields are present.

**Validates: Requirement 9.1**

### Property 29: Numeric Field Validation

For any batch request, the system SHALL validate that all numeric fields contain valid numbers.

**Validates: Requirement 9.2**

### Property 30: String Field Validation

For any batch request, the system SHALL validate that all string fields are non-empty and properly formatted.

**Validates: Requirement 9.3**

### Property 31: Product ID Format Validation

For any Product_ID provided, the system SHALL validate that it matches the expected format.

**Validates: Requirement 9.4**

### Property 32: Positive Number Validation

For any quantity or price provided, the system SHALL validate that it is a positive number.

**Validates: Requirement 9.5**

### Property 33: Inventory Validation Before Commit

For any batch, the system SHALL perform inventory validation for all items before committing any changes.

**Validates: Requirement 10.2**

### Property 34: Atomic Transaction Completion

For any batch, the system SHALL complete the database transaction atomically without partial commits.

**Validates: Requirement 10.4**

### Property 35: Inventory Shortage Error Details

For any batch failing due to inventory shortage, the response SHALL indicate which specific products have insufficient inventory.

**Validates: Requirement 11.1**

### Property 36: Validation Error Details

For any batch failing due to validation errors, the response SHALL list all validation errors with field names and reasons.

**Validates: Requirement 11.2**

### Property 37: Retryable Error Response

For any failed batch, the response SHALL provide sufficient information to allow the agent to retry with corrected data.

**Validates: Requirement 11.3**

### Property 38: No Partial Transactions on Rejection

For any rejected batch, the system SHALL not create any partial transactions or inventory changes.

**Validates: Requirement 11.4**

### Property 39: Error ID for Support Reference

For any error response, the system SHALL include a unique error ID for support reference.

**Validates: Requirement 11.5**

### Property 40: Unique Batch ID Generation

For any batch submitted, the system SHALL generate a unique Batch_ID for tracking.

**Validates: Requirement 12.1**

### Property 41: Duplicate Detection Using Agent and Product Data

For duplicate detection, the system SHALL use a combination of Agent_ID, Product_IDs, and quantities.

**Validates: Requirement 12.5**
