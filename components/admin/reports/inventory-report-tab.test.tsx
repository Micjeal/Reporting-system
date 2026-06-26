/**
 * Inventory Report Tab - Test Suite
 * 
 * Tests for the inventory report tab component including:
 * - KPI card calculations
 * - Filter functionality
 * - Chart rendering
 * - Table pagination
 * - CSV export
 * - Loading and error states
 * - Responsive design
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InventoryReportTab } from './inventory-report-tab'

// Mock fetch
global.fetch = vi.fn()

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: () => <div data-testid="line-chart">LineChart</div>,
  PieChart: () => <div data-testid="pie-chart">PieChart</div>,
  Line: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

describe('InventoryReportTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('KPI Cards', () => {
    it('should display all 4 KPI cards', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        if (url.includes('inventory-trends')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] }),
          })
        }
        if (url.includes('inventory-categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] }),
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByText('Total Units')).toBeInTheDocument()
        expect(screen.getByText('Total Categories')).toBeInTheDocument()
        expect(screen.getByText('Most Issued Item')).toBeInTheDocument()
        expect(screen.getByText('Inventory Value')).toBeInTheDocument()
      })
    })

    it('should calculate total units correctly', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        // Total units should be 100 + 50 = 150
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('should display most issued item correctly', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
        expect(screen.getByText('100 units')).toBeInTheDocument()
      })
    })

    it('should calculate inventory value correctly', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        // Total units = 150, estimated unit price = $100, so value = $15,000
        expect(screen.getByText('$15,000')).toBeInTheDocument()
      })
    })
  })

  describe('Filters', () => {
    it('should display filter controls', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
        expect(screen.getByLabelText('Product')).toBeInTheDocument()
        expect(screen.getByLabelText('Sort By')).toBeInTheDocument()
        expect(screen.getByText('Reset Filters')).toBeInTheDocument()
      })
    })

    it('should filter inventory by product', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        const productSelect = screen.getByLabelText('Product') as HTMLSelectElement
        fireEvent.change(productSelect, { target: { value: 'Product A' } })
      })

      // After filtering, only Product A should be shown in the table
      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })
    })

    it('should reset filters when reset button is clicked', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        const productSelect = screen.getByLabelText('Product') as HTMLSelectElement
        fireEvent.change(productSelect, { target: { value: 'Product A' } })
      })

      const resetButton = screen.getByText('Reset Filters')
      fireEvent.click(resetButton)

      await waitFor(() => {
        const productSelect = screen.getByLabelText('Product') as HTMLSelectElement
        expect(productSelect.value).toBe('all')
      })
    })
  })

  describe('Charts', () => {
    it('should render inventory trend chart', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-trends')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                { date: '2024-01-01', total_units: 100, item_count: 5 },
                { date: '2024-01-02', total_units: 110, item_count: 5 },
              ],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })

    it('should render category breakdown chart', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                { product: 'Product A', total_units: 100 },
                { product: 'Product B', total_units: 50 },
              ],
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      })
    })
  })

  describe('Table', () => {
    it('should display inventory breakdown table', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByText('Inventory Breakdown')).toBeInTheDocument()
        expect(screen.getByText('Product')).toBeInTheDocument()
        expect(screen.getByText('Units Issued')).toBeInTheDocument()
      })
    })

    it('should paginate table with 10 rows per page', async () => {
      const mockInventoryData = Array.from({ length: 25 }, (_, i) => ({
        product: `Product ${i + 1}`,
        issued: 100 - i * 2,
        sold: 80 - i * 2,
      }))

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        // Should show "Showing 10 of 25 items"
        expect(screen.getByText(/Showing 10 of 25 items/)).toBeInTheDocument()
      })
    })

    it('should navigate between pages', async () => {
      const mockInventoryData = Array.from({ length: 25 }, (_, i) => ({
        product: `Product ${i + 1}`,
        issued: 100 - i * 2,
        sold: 80 - i * 2,
      }))

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
      })
    })
  })

  describe('Export', () => {
    it('should export data as CSV', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
        { product: 'Product B', issued: 50, sold: 40 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()

      render(<InventoryReportTab />)

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV')
        fireEvent.click(exportButton)
      })

      // Verify that the export was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('should use correct CSV filename format', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      // Mock document.createElement to capture the download link
      const createElementSpy = jest.spyOn(document, 'createElement')
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      createElementSpy.mockReturnValueOnce(mockLink as any)

      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()

      render(<InventoryReportTab />)

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV')
        fireEvent.click(exportButton)
      })

      // Verify filename format: inventory-report-YYYY-MM-DD.csv
      expect(mockLink.download).toMatch(/^inventory-report-\d{4}-\d{2}-\d{2}\.csv$/)

      createElementSpy.mockRestore()
    })
  })

  describe('Loading and Error States', () => {
    it('should display loading state while fetching data', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<InventoryReportTab />)

      expect(screen.getByText('Loading chart...')).toBeInTheDocument()
    })

    it('should display error state on API failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch inventory data')
      )

      render(<InventoryReportTab />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch inventory data')).toBeInTheDocument()
      })
    })

    it('should display error alert with correct styling', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      render(<InventoryReportTab />)

      await waitFor(() => {
        const alert = screen.getByText('API Error').closest('[role="alert"]')
        expect(alert).toHaveClass('border-red-500')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render responsive grid for KPI cards', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        const kpiGrid = screen.getByText('Total Units').closest('div')?.parentElement
        expect(kpiGrid).toHaveClass('grid')
        expect(kpiGrid).toHaveClass('grid-cols-1')
        expect(kpiGrid).toHaveClass('sm:grid-cols-2')
        expect(kpiGrid).toHaveClass('lg:grid-cols-4')
      })
    })

    it('should render responsive table', async () => {
      const mockInventoryData = [
        { product: 'Product A', issued: 100, sold: 80 },
      ]

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('inventory-utilization')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockInventoryData }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
      })

      render(<InventoryReportTab />)

      await waitFor(() => {
        const table = screen.getByText('Product').closest('table')
        expect(table).toBeInTheDocument()
      })
    })
  })
})
