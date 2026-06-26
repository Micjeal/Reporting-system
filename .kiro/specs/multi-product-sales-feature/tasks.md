# Implementation Plan: Multi-Product Sales Feature

## Overview

This implementation plan breaks down the multi-product sales feature into discrete, manageable tasks that build incrementally. The feature enables sales agents to process batch transactions containing 1-50 products in a single operation with atomic transaction handling, inventory validation, and comprehensive audit logging.

The implementation follows a layered approach:
1. **Foundation**: Core types, schemas, and database utilities
2. **Validation Layer**: Input validation and inventory checks
3. **Business Logic**: Batch processing and atomicity
4. **API Endpoint**: HTTP handler with error handling
5. **Frontend Components**: UI for batch sales creation
6. **Integration**: Wiring components together
7. **Testing**: Property-based and unit tests

## Tasks

- [x] 1. Set up core types, schemas, and database utilities
  - [x] 1.1 Create batch sales TypeScript types and interfaces
    - Define BatchSalesRequest, BatchSalesResponse, LineItem, BatchError types
    - Define error codes enum (EMPTY_BATCH, BATCH_SIZE_EXCEEDED, INSUFFICIENT_INVENTORY, etc.)
    - _Requirements: 1.1, 7.1, 8.1_
  
  - [x] 1.2 Create Zod validation schema for batch sales requests
    - Validate batch structure with 1-50 line items
    - Validate line item fields (productId, quantity, unitPrice, returnQuantity)
    - Validate numeric constraints (positive quantities and prices)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 1.3 Create database utility functions for batch operations
    - Function to fetch product details by ID
    - Function to check current inventory levels
    - Function to create database transaction context
    - _Requirements: 3.1, 3.2_

- [x] 2. Implement inventory validation layer
  - [x] 2.1 Create inventory validation service
    - Validate each line item against current inventory
    - Check for duplicate product IDs in batch
    - Return detailed validation errors with product-specific issues
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.3_
  
  - [ ]* 2.2 Write property test for inventory validation
    - **Property 9: Inventory Shortage Detection**
    - **Validates: Requirement 3.1**
  
  - [ ]* 2.3 Write property test for duplicate product detection
    - **Property 8: Duplicate Product Detection**
    - **Validates: Requirement 2.3**
  
  - [ ]* 2.4 Write unit tests for inventory validation edge cases
    - Test with zero inventory
    - Test with exact quantity match
    - Test with multiple products
    - _Requirements: 3.1, 3.2_

- [x] 3. Implement batch validation and processing logic
  - [x] 3.1 Create batch validation service
    - Validate batch size (1-50 items)
    - Validate all required fields present
    - Validate line item calculations (quantity × unitPrice = lineTotal)
    - Validate return quantity constraints (returnQuantity ≤ quantity)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1_
  
  - [ ]* 3.2 Write property test for batch size enforcement
    - **Property 4: Batch Size Enforcement**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ]* 3.3 Write property test for line item calculation
    - **Property 2: Line Item Calculation**
    - **Validates: Requirements 1.2, 7.2, 8.2**
  
  - [ ]* 3.4 Write property test for return quantity validation
    - **Property 3: Return Quantity Validation**
    - **Validates: Requirement 1.3**
  
  - [ ]* 3.5 Write unit tests for batch validation edge cases
    - Test empty batch rejection
    - Test oversized batch rejection
    - Test missing fields
    - _Requirements: 1.4, 1.5, 9.1_

- [ ] 4. Implement batch processing and atomicity
  - [ ] 4.1 Create batch processing service with transaction handling
    - Implement atomic transaction wrapper
    - Decrement inventory for all line items
    - Generate unique Batch_ID and Transaction_ID
    - Handle transaction rollback on any failure
    - _Requirements: 2.1, 2.2, 2.4, 10.4_
  
  - [ ]* 4.2 Write property test for batch atomicity on success
    - **Property 6: Batch Atomicity on Success**
    - **Validates: Requirement 2.1**
  
  - [ ]* 4.3 Write property test for batch atomicity on failure
    - **Property 7: Batch Atomicity on Failure**
    - **Validates: Requirement 2.2**
  
  - [ ]* 4.4 Write property test for inventory non-negativity
    - **Property 11: Inventory Non-Negativity**
    - **Validates: Requirement 3.5**
  
  - [ ]* 4.5 Write unit tests for transaction rollback scenarios
    - Test rollback on inventory shortage
    - Test rollback on database error
    - Verify inventory unchanged after rollback
    - _Requirements: 2.2, 2.4_

- [ ] 5. Implement idempotency and duplicate detection
  - [ ] 5.1 Create duplicate detection service
    - Generate idempotency key from Agent_ID, Product_IDs, and quantities
    - Store and check idempotency keys in database
    - Return cached response for duplicate requests within 5 minutes
    - _Requirements: 1.6, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 5.2 Write property test for idempotency
    - **Property 5: Idempotency**
    - **Validates: Requirements 1.6, 12.2, 12.3, 12.4**
  
  - [ ]* 5.3 Write unit tests for duplicate detection
    - Test same batch submitted twice
    - Test different batches not treated as duplicates
    - Test 5-minute window expiration
    - _Requirements: 1.6, 12.2_

- [ ] 6. Implement audit logging integration
  - [ ] 6.1 Create audit logging service for batch operations
    - Log batch creation with Agent_ID, Batch_ID, timestamp
    - Log inventory changes per product with Transaction_ID
    - Log all validation failures with error codes
    - Log successful batch completion
    - Ensure ISO8601 timestamp format
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [ ]* 6.2 Write property test for audit log completeness
    - **Property 13: Audit Log Completeness**
    - **Validates: Requirement 5.1**
  
  - [ ]* 6.3 Write property test for audit log timestamp format
    - **Property 16: Audit Log Timestamp Format**
    - **Validates: Requirement 5.5**
  
  - [ ]* 6.4 Write unit tests for audit logging
    - Test log creation on success
    - Test log creation on failure
    - Test immutability of logs
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 7. Implement error handling and response formatting
  - [ ] 7.1 Create error response builder
    - Format error responses with code, message, and details
    - Include unique error ID for support reference
    - Provide detailed field-level validation errors
    - Include specific product-level errors for inventory issues
    - _Requirements: 6.2, 6.3, 11.1, 11.2, 11.5_
  
  - [ ]* 7.2 Write property test for error response structure
    - **Property 18: Error Response Structure**
    - **Validates: Requirement 6.2**
  
  - [ ]* 7.3 Write property test for validation error response
    - **Property 19: Validation Error Response**
    - **Validates: Requirement 6.3**
  
  - [ ]* 7.4 Write unit tests for error scenarios
    - Test insufficient inventory error
    - Test product not found error
    - Test invalid quantity error
    - Test invalid price error
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Implement batch sales API endpoint
  - [ ] 8.1 Create POST /api/sales/batch endpoint
    - Implement authentication check (HTTP 401 for unauthenticated)
    - Implement authorization check (HTTP 403 for non-agents)
    - Parse and validate request body
    - Call batch processing service
    - Return appropriate HTTP status codes (200, 400, 422, 503)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3_
  
  - [ ] 8.2 Implement request validation middleware
    - Validate JSON structure
    - Return HTTP 400 for malformed JSON
    - Return HTTP 422 for validation errors
    - _Requirements: 4.3, 4.4, 6.3_
  
  - [ ] 8.3 Implement response formatting
    - Return HTTP 200 with Batch_ID, Transaction_ID, total amount on success
    - Include line item details with individual status for each product
    - Include ISO8601 timestamp
    - Include errors array with code, message, details
    - _Requirements: 6.1, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 8.4 Write property test for successful response structure
    - **Property 17: Successful Response Structure**
    - **Validates: Requirement 6.1**
  
  - [ ]* 8.5 Write property test for response completeness
    - **Property 20: Response Completeness**
    - **Validates: Requirement 6.5**
  
  - [ ]* 8.6 Write property test for response total amount
    - **Property 25: Response Total Amount**
    - **Validates: Requirement 8.2**
  
  - [ ]* 8.7 Write integration tests for API endpoint
    - Test successful batch creation
    - Test authentication failure
    - Test authorization failure
    - Test validation error responses
    - Test inventory shortage handling
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3_

- [ ] 9. Checkpoint - Ensure all backend tests pass
  - Ensure all property-based tests pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ask the user if questions arise

- [ ] 10. Create frontend components for batch sales
  - [ ] 10.1 Create MultiProductSaleForm component
    - Manage form state for multiple line items
    - Handle dynamic line item addition/removal
    - Calculate running total
    - Validate form before submission
    - _Requirements: 1.1, 7.1, 7.2_
  
  - [ ] 10.2 Create LineItemsTable component
    - Display all line items in batch
    - Show Product_ID, quantity, Unit_Price, Line_Total for each
    - Allow inline editing of line items
    - Show validation errors per line item
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 10.3 Create ProductSelector component
    - Dropdown to select products
    - Show product name and unit price
    - Filter out products with zero inventory
    - _Requirements: 3.1, 3.2_
  
  - [ ] 10.4 Create LineItemEditor component
    - Edit quantity and return quantity for line item
    - Validate return quantity ≤ quantity
    - Show unit price and calculated line total
    - _Requirements: 1.2, 1.3, 7.1_

- [ ] 11. Implement form state management and validation
  - [ ] 11.1 Create batch sales form hook (useBatchSalesForm)
    - Manage array of line items
    - Validate entire batch
    - Calculate batch total
    - Handle form submission
    - _Requirements: 1.1, 1.2, 1.3, 9.1_
  
  - [ ] 11.2 Create line item validation logic
    - Validate individual line item fields
    - Check inventory availability
    - Validate return quantity constraints
    - Return field-level errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 1.3_
  
  - [ ] 11.3 Implement form error display
    - Show batch-level errors
    - Show line-item-level errors
    - Show inventory shortage details
    - Highlight invalid fields
    - _Requirements: 11.1, 11.2_

- [ ] 12. Implement user feedback and error handling
  - [ ] 12.1 Create error toast notifications
    - Display batch processing errors
    - Show inventory shortage details
    - Show validation errors
    - Include error ID for support reference
    - _Requirements: 6.2, 6.3, 11.1, 11.5_
  
  - [ ] 12.2 Create success notification
    - Display Batch_ID and Transaction_ID
    - Show total amount processed
    - Show line item summary
    - Provide option to create another batch
    - _Requirements: 6.1, 8.1, 8.5_
  
  - [ ] 12.3 Implement loading states
    - Show spinner during batch submission
    - Disable form during submission
    - Show progress for large batches
    - _Requirements: 10.1_

- [ ] 13. Wire components together
  - [ ] 13.1 Integrate MultiProductSaleForm with API
    - Connect form submission to POST /api/sales/batch
    - Handle response and errors
    - Display success/error feedback
    - _Requirements: 1.1, 6.1, 6.2_
  
  - [ ] 13.2 Create batch sales page
    - Render MultiProductSaleForm
    - Add navigation and layout
    - Add help text and instructions
    - _Requirements: 1.1_
  
  - [ ] 13.3 Add batch sales route to navigation
    - Add link in agent dashboard
    - Add link in sales menu
    - _Requirements: 1.1_

- [ ] 14. Checkpoint - Ensure all frontend tests pass
  - Ensure all component tests pass
  - Ensure form validation works correctly
  - Ensure error handling displays properly
  - Ask the user if questions arise

- [ ] 15. Integration testing and end-to-end validation
  - [ ] 15.1 Write end-to-end test for successful batch creation
    - Create batch with multiple products
    - Verify inventory decremented
    - Verify audit logs created
    - Verify response contains all required fields
    - _Requirements: 1.1, 2.1, 5.1, 6.1, 8.5_
  
  - [ ]* 15.2 Write integration test for batch atomicity
    - Create batch with one invalid product
    - Verify entire batch rejected
    - Verify no inventory changes
    - Verify error response includes all details
    - _Requirements: 2.2, 2.4, 6.2_
  
  - [ ]* 15.3 Write integration test for duplicate detection
    - Submit same batch twice
    - Verify same Batch_ID returned
    - Verify no duplicate inventory changes
    - _Requirements: 1.6, 12.2, 12.3_
  
  - [ ]* 15.4 Write integration test for concurrent batch processing
    - Submit multiple batches concurrently
    - Verify each processed independently
    - Verify inventory accurate for all
    - _Requirements: 10.3_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all property-based tests pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ensure all end-to-end tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are strongly recommended for production quality
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- Checkpoints ensure incremental validation and catch issues early
- The dependency graph shows which tasks can run in parallel
- Frontend components use React Hook Form and Zod for validation (consistent with existing patterns)
- API endpoint follows existing patterns from expenses and other routes
- Audit logging integrates with existing audit system

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["4.1", "5.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "5.2", "5.3"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 10, "tasks": ["8.4", "8.5", "8.6", "8.7"] },
    { "id": 11, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 12, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 13, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 14, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 15, "tasks": ["15.1", "15.2", "15.3", "15.4"] }
  ]
}
```
