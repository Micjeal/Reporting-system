# Database Migrations

This folder contains all SQL migration files for the database schema.

## Naming Convention

Migrations should follow the pattern: `XXX_description.sql`
- `XXX` = Sequential number (e.g., 001, 002, 003)
- `description` = Brief description using snake_case

## Current Migrations

- **000_schema.sql** - Initial database schema
- **001_add_sales_fields.sql** - Added sales fields
- **002_multi_product_sales.sql** - Multi-product sales support
- **003_expenses_receipts.sql** - Expenses and receipts functionality
- **004_fix_email_confirmation.sql** - Email confirmation fixes

## Guidelines

- Always use sequential numbering
- Test migrations locally before committing
- Include both UP and DOWN migrations when possible
- Document breaking changes in the migration file
