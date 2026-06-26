/**
 * Batch Sales Types and Interfaces
 * Defines the data structures for multi-product batch sales operations
 */

/**
 * LineItem interface represents a single product in a batch sale
 */
export interface LineItem {
  /** Unique identifier for the line item */
  id: string;
  /** Product identifier */
  productId: string;
  /** Product name */
  productName: string;
  /** Price per unit */
  unitPrice: number;
  /** Quantity sold */
  quantity: number;
  /** Total amount for this line item (quantity × unitPrice) */
  totalAmount: number;
  /** Amount of returns for this line item */
  returnsAmount: number;
  /** Adjustments amount for this line item */
  adjustmentsAmount: number;
}

/**
 * BatchSalesRequest interface represents the request payload for batch sales
 */
export interface BatchSalesRequest {
  /** Array of line items in the batch */
  lineItems: LineItem[];
  /** Sale date in YYYY-MM-DD format */
  saleDate: string;
  /** Optional customer name */
  customerName?: string;
  /** Optional customer phone number */
  customerPhone?: string;
  /** Optional location of sale */
  location?: string;
  /** Optional route identifier */
  route?: string;
  /** Optional bank details */
  bankDetails?: string;
  /** Total expenses for this batch */
  expensesTotal: number;
  /** Number of tokens deducted */
  tokensDeducted: number;
  /** Optional notes about the batch */
  notes?: string;
}

/**
 * Sale record interface for individual sales in the response
 */
export interface Sale {
  /** Sale record identifier */
  id: string;
  /** Product identifier */
  productId: string;
  /** Product name */
  productName: string;
  /** Quantity sold */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Total amount for this sale */
  totalAmount: number;
  /** Status of this sale record */
  status: 'success' | 'failed';
  /** Optional error message if status is failed */
  error?: string;
}

/**
 * BatchSalesResponse interface represents the response from batch sales operation
 */
export interface BatchSalesResponse {
  /** Unique batch identifier */
  batchId: string;
  /** Array of created sale records */
  saleRecords: Sale[];
  /** Total amount for the entire batch */
  totalAmount: number;
  /** Total quantity of items in the batch */
  totalQuantity: number;
  /** Total returns amount */
  totalReturns: number;
  /** ISO timestamp of when the batch was created */
  createdAt: string;
}

/**
 * BatchError interface represents an error in batch processing
 */
export interface BatchError {
  /** Error code identifier */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: Record<string, any>;
}

/**
 * Error codes enum for batch sales operations
 */
export enum BatchErrorCode {
  /** Batch contains no line items */
  EMPTY_BATCH = 'EMPTY_BATCH',
  /** Batch exceeds maximum size of 50 items */
  BATCH_SIZE_EXCEEDED = 'BATCH_SIZE_EXCEEDED',
  /** Product has insufficient inventory */
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  /** Product not found in system */
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  /** Invalid quantity provided */
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  /** Invalid price provided */
  INVALID_PRICE = 'INVALID_PRICE',
  /** Batch contains duplicate products */
  DUPLICATE_PRODUCTS = 'DUPLICATE_PRODUCTS',
  /** Invalid or malformed request */
  INVALID_REQUEST = 'INVALID_REQUEST',
  /** User not authorized to perform this action */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Transaction failed during processing */
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}
