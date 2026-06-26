/**
 * Auto-generated Supabase database types
 * This should ideally be generated via: npx supabase gen types typescript --local
 * For now, this is a manual definition of your schema
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'agent'
          status: 'pending' | 'active' | 'rejected' | 'suspended'
          name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'agent'
          status?: 'pending' | 'active' | 'rejected' | 'suspended'
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'agent'
          status?: 'pending' | 'active' | 'rejected' | 'suspended'
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          region: string
          monthly_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          region: string
          monthly_target?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          region?: string
          monthly_target?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          unit_price: number
          quantity: number
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          unit_price: number
          quantity?: number
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          unit_price?: number
          quantity?: number
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          agent_id: string
          customer_name?: string | null
          customer_phone?: string | null
          payment_method?: string | null
          sale_date?: string | null
          total_amount?: number | null
          location?: string | null
          route?: string | null
          bank_details?: string | null
          expenses_total?: number | null
          tokens_deducted?: number | null
          returns_amount?: number | null
          notes?: string | null
          // Legacy columns (kept for backward compatibility)
          product_id?: string | null
          quantity?: number | null
          amount?: number | null
          date?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          customer_name?: string | null
          customer_phone?: string | null
          payment_method?: string | null
          sale_date?: string | null
          total_amount?: number | null
          location?: string | null
          route?: string | null
          bank_details?: string | null
          expenses_total?: number | null
          tokens_deducted?: number | null
          returns_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          payment_method?: string | null
          sale_date?: string | null
          total_amount?: number | null
          location?: string | null
          route?: string | null
          bank_details?: string | null
          expenses_total?: number | null
          tokens_deducted?: number | null
          returns_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: number
          sale_id: number
          product_id: number
          quantity: number
          unit_price: number
          line_total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          sale_id: number
          product_id: number
          quantity: number
          unit_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          sale_id?: number
          product_id?: number
          quantity?: number
          unit_price?: number
          line_total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          agent_id: string
          category: 'fuel' | 'food' | 'accommodation' | 'airtime' | 'other'
          description: string
          amount: number
          receipt_url: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          category: 'fuel' | 'food' | 'accommodation' | 'airtime' | 'other'
          description: string
          amount: number
          receipt_url?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          category?: 'fuel' | 'food' | 'accommodation' | 'airtime' | 'other'
          description?: string
          amount?: number
          receipt_url?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          agent_id: string
          product_id: string
          quantity_issued: number
          date_issued: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          product_id: string
          quantity_issued: number
          date_issued: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          product_id?: string
          quantity_issued?: number
          date_issued?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string
          action: string
          target_table: string
          target_id: string
          details: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          target_table: string
          target_id: string
          details?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          target_table?: string
          target_id?: string
          details?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          notification_preferences: {
            email: {
              salesAlerts: boolean
              inventoryAlerts: boolean
              userApprovals: boolean
              systemUpdates: boolean
            }
            push: {
              salesAlerts: boolean
              inventoryAlerts: boolean
              userApprovals: boolean
            }
            inApp: {
              salesAlerts: boolean
              inventoryAlerts: boolean
              userApprovals: boolean
              systemUpdates: boolean
            }
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          notification_preferences?: {
            email?: {
              salesAlerts?: boolean
              inventoryAlerts?: boolean
              userApprovals?: boolean
              systemUpdates?: boolean
            }
            push?: {
              salesAlerts?: boolean
              inventoryAlerts?: boolean
              userApprovals?: boolean
            }
            inApp?: {
              salesAlerts?: boolean
              inventoryAlerts?: boolean
              userApprovals?: boolean
              systemUpdates?: boolean
            }
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          notification_preferences?: {
            email?: {
              salesAlerts?: boolean
              inventoryAlerts?: boolean
              userApprovals?: boolean
              systemUpdates?: boolean
            }
            push?: {
              salesAlerts?: boolean
              inventoryAlerts?: boolean
              userApprovals?: boolean
            }
            inApp?: {
              salesAlerts?: boolean
              inventoryAlerts?: boolean
              userApprovals?: boolean
              systemUpdates?: boolean
            }
          }
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
