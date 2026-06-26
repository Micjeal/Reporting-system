# Bugfix Requirements Document

## Introduction

When an agent submits the new-sale form at `/agent/sales/new`, four fields — `bank_details`, `expenses_total`, `tokens_deducted`, and `returns_amount` — are collected by the form and passed to `salesService.createSale()`, but are silently discarded before reaching the database. The data loss happens at two layers: the `CreateSalePayload` TypeScript type in `services/sales.service.ts` omits these fields, and the `createSaleSchema` Zod validator in `app/api/sales/route.ts` does not parse them, so they are stripped from the request body before the DB insert. As a result, the admin sales page at `/admin/sales` always shows null/zero for these columns even though the agent entered values.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an agent submits a sale with a non-empty `bank_details` value THEN the system silently drops the value and stores `NULL` in the `sales.bank_details` column

1.2 WHEN an agent submits a sale with a non-zero `expenses_total` value THEN the system silently drops the value and stores the column default (`0`) in `sales.expenses_total`

1.3 WHEN an agent submits a sale with a non-zero `tokens_deducted` value THEN the system silently drops the value and stores the column default (`0`) in `sales.tokens_deducted`

1.4 WHEN an agent submits a sale with a non-zero `returns_amount` value THEN the system silently drops the value and stores the column default (`0`) in `sales.returns_amount`

1.5 WHEN the admin views the sales table or exports the CSV THEN `bank_details`, `expenses_total`, `tokens_deducted`, and `returns_amount` are always null/zero regardless of what the agent entered

### Expected Behavior (Correct)

2.1 WHEN an agent submits a sale with a non-empty `bank_details` value THEN the system SHALL persist that value to `sales.bank_details` and return it in the API response

2.2 WHEN an agent submits a sale with a non-zero `expenses_total` value THEN the system SHALL persist that value to `sales.expenses_total` and return it in the API response

2.3 WHEN an agent submits a sale with a non-zero `tokens_deducted` value THEN the system SHALL persist that value to `sales.tokens_deducted` and return it in the API response

2.4 WHEN an agent submits a sale with a non-zero `returns_amount` value THEN the system SHALL persist that value to `sales.returns_amount` and return it in the API response

2.5 WHEN the admin views the sales table or exports the CSV THEN `bank_details`, `expenses_total`, `tokens_deducted`, and `returns_amount` SHALL reflect the values the agent submitted

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an agent submits a sale without providing `bank_details` THEN the system SHALL CONTINUE TO store `NULL` for that column

3.2 WHEN an agent submits a sale without providing `expenses_total`, `tokens_deducted`, or `returns_amount` THEN the system SHALL CONTINUE TO store `0` (the column default) for those columns

3.3 WHEN an agent submits a sale with the required fields (`product_id`, `quantity`, `amount`, `date`) THEN the system SHALL CONTINUE TO create the sale record and its line items successfully

3.4 WHEN an agent submits a sale with invalid or missing required fields THEN the system SHALL CONTINUE TO return a validation error and not create any records

3.5 WHEN the API receives a sale payload that includes `customer_name`, `customer_phone`, `location`, `route`, or `notes` THEN the system SHALL CONTINUE TO persist those fields correctly

3.6 WHEN the admin sales page fetches sales data THEN the system SHALL CONTINUE TO return all existing fields (`id`, `agent_id`, `customer_name`, `payment_method`, `sale_date`, `total_amount`, etc.) without regression
