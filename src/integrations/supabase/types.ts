export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          address: string | null
          branding_config: Json | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          custom_domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          org_id: string
          payment_terms: number | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          branding_config?: Json | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          org_id: string
          payment_terms?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          branding_config?: Json | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          org_id?: string
          payment_terms?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_contracts: {
        Row: {
          agency_id: string
          booking_terms: Json | null
          commission_rate: number | null
          contract_name: string
          contract_type: string
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean | null
          rate_details: Json
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          agency_id: string
          booking_terms?: Json | null
          commission_rate?: number | null
          contract_name: string
          contract_type: string
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          rate_details?: Json
          updated_at?: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          agency_id?: string
          booking_terms?: Json | null
          commission_rate?: number | null
          contract_name?: string
          contract_type?: string
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          rate_details?: Json
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          diff_json: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          org_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff_json?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          org_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff_json?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          org_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_holds: {
        Row: {
          adults: number
          agency_id: string
          check_in: string
          check_out: string
          children: number
          created_at: string
          currency: string
          expires_at: string
          guest_name: string
          hotel_id: string
          id: string
          rate_quoted: number
          room_type_id: string
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adults?: number
          agency_id: string
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          currency?: string
          expires_at: string
          guest_name: string
          hotel_id: string
          id?: string
          rate_quoted: number
          room_type_id: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adults?: number
          agency_id?: string
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          currency?: string
          expires_at?: string
          guest_name?: string
          hotel_id?: string
          id?: string
          rate_quoted?: number
          room_type_id?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashier_sessions: {
        Row: {
          card_collected: number | null
          cash_collected: number | null
          closed_at: string | null
          closing_balance: number | null
          created_at: string
          hotel_id: string
          id: string
          is_closed: boolean | null
          notes: string | null
          opened_at: string
          opening_balance: number | null
          org_id: string
          other_collected: number | null
          session_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_collected?: number | null
          cash_collected?: number | null
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          hotel_id: string
          id?: string
          is_closed?: boolean | null
          notes?: string | null
          opened_at?: string
          opening_balance?: number | null
          org_id: string
          other_collected?: number | null
          session_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_collected?: number | null
          cash_collected?: number | null
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          hotel_id?: string
          id?: string
          is_closed?: boolean | null
          notes?: string | null
          opened_at?: string
          opening_balance?: number | null
          org_id?: string
          other_collected?: number | null
          session_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashier_sessions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashier_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashier_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          channel_type: string
          commission_rate: number | null
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean | null
          last_sync: string | null
          name: string
          password: string | null
          settings: Json | null
          sync_errors: Json | null
          sync_status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          channel_type?: string
          commission_rate?: number | null
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          name: string
          password?: string | null
          settings?: Json | null
          sync_errors?: Json | null
          sync_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          channel_type?: string
          commission_rate?: number | null
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          name?: string
          password?: string | null
          settings?: Json | null
          sync_errors?: Json | null
          sync_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          payment_terms: number | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      competitor_rates: {
        Row: {
          availability_status: string | null
          competitor_name: string
          competitor_room_type: string
          currency: string
          date: string
          hotel_id: string
          id: string
          our_room_type_id: string
          rate: number
          scraped_at: string
          source: string
        }
        Insert: {
          availability_status?: string | null
          competitor_name: string
          competitor_room_type: string
          currency?: string
          date: string
          hotel_id: string
          id?: string
          our_room_type_id: string
          rate: number
          scraped_at?: string
          source: string
        }
        Update: {
          availability_status?: string | null
          competitor_name?: string
          competitor_room_type?: string
          currency?: string
          date?: string
          hotel_id?: string
          id?: string
          our_room_type_id?: string
          rate?: number
          scraped_at?: string
          source?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          decimal_places: number | null
          id: string
          is_active: boolean | null
          is_base: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          code: string
          created_at?: string
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          is_base?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          code?: string
          created_at?: string
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          is_base?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      daily_rates: {
        Row: {
          created_at: string
          date: string
          hotel_id: string
          id: string
          rate: number
          rate_plan_id: string
          room_type_id: string
        }
        Insert: {
          created_at?: string
          date: string
          hotel_id: string
          id?: string
          rate: number
          rate_plan_id: string
          room_type_id: string
        }
        Update: {
          created_at?: string
          date?: string
          hotel_id?: string
          id?: string
          rate?: number
          rate_plan_id?: string
          room_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rates_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_rates_rate_plan_id_fkey"
            columns: ["rate_plan_id"]
            isOneToOne: false
            referencedRelation: "rate_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_rates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string
          factors: Json | null
          forecast_date: string
          forecast_type: string
          hotel_id: string
          id: string
          model_version: string | null
          predicted_value: number
          room_type_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          factors?: Json | null
          forecast_date: string
          forecast_type: string
          hotel_id: string
          id?: string
          model_version?: string | null
          predicted_value: number
          room_type_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          factors?: Json | null
          forecast_date?: string
          forecast_type?: string
          hotel_id?: string
          id?: string
          model_version?: string | null
          predicted_value?: number
          room_type_id?: string
        }
        Relationships: []
      }
      digital_keys: {
        Row: {
          access_log: Json | null
          created_at: string
          expires_at: string
          guest_id: string
          hotel_id: string
          id: string
          is_active: boolean | null
          issued_at: string
          key_code: string
          key_type: string
          reservation_id: string
          room_id: string
        }
        Insert: {
          access_log?: Json | null
          created_at?: string
          expires_at: string
          guest_id: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          issued_at?: string
          key_code: string
          key_type?: string
          reservation_id: string
          room_id: string
        }
        Update: {
          access_log?: Json | null
          created_at?: string
          expires_at?: string
          guest_id?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          issued_at?: string
          key_code?: string
          key_type?: string
          reservation_id?: string
          room_id?: string
        }
        Relationships: []
      }
      e_invoices: {
        Row: {
          compliance_data: Json | null
          created_at: string
          currency: string
          digital_signature: string | null
          document_number: string
          e_invoice_type: string
          email_sent: boolean | null
          exchange_rate: number | null
          guest_id: string
          hotel_id: string
          id: string
          invoice_date: string
          invoice_id: string
          pdf_url: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_number: string | null
          tax_office: string | null
          total_amount: number
          updated_at: string
          xml_content: string | null
        }
        Insert: {
          compliance_data?: Json | null
          created_at?: string
          currency?: string
          digital_signature?: string | null
          document_number: string
          e_invoice_type: string
          email_sent?: boolean | null
          exchange_rate?: number | null
          guest_id: string
          hotel_id: string
          id?: string
          invoice_date: string
          invoice_id: string
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_number?: string | null
          tax_office?: string | null
          total_amount?: number
          updated_at?: string
          xml_content?: string | null
        }
        Update: {
          compliance_data?: Json | null
          created_at?: string
          currency?: string
          digital_signature?: string | null
          document_number?: string
          e_invoice_type?: string
          email_sent?: boolean | null
          exchange_rate?: number | null
          guest_id?: string
          hotel_id?: string
          id?: string
          invoice_date?: string
          invoice_id?: string
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_number?: string | null
          tax_office?: string | null
          total_amount?: number
          updated_at?: string
          xml_content?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          brand: string | null
          created_at: string
          equipment_type: string
          hotel_id: string
          id: string
          last_maintenance: string | null
          model: string | null
          next_maintenance: string | null
          purchase_date: string | null
          room_id: string | null
          serial_number: string | null
          specifications: Json | null
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          equipment_type: string
          hotel_id: string
          id?: string
          last_maintenance?: string | null
          model?: string | null
          next_maintenance?: string | null
          purchase_date?: string | null
          room_id?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          equipment_type?: string
          hotel_id?: string
          id?: string
          last_maintenance?: string | null
          model?: string | null
          next_maintenance?: string | null
          purchase_date?: string | null
          room_id?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          date: string
          from_currency: string
          id: string
          rate: number
          to_currency: string
        }
        Insert: {
          created_at?: string
          date?: string
          from_currency: string
          id?: string
          rate: number
          to_currency: string
        }
        Update: {
          created_at?: string
          date?: string
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
        }
        Relationships: []
      }
      guest_communications: {
        Row: {
          communication_type: string
          content: string
          created_at: string
          guest_id: string
          hotel_id: string
          id: string
          metadata: Json | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          communication_type: string
          content: string
          created_at?: string
          guest_id: string
          hotel_id: string
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          communication_type?: string
          content?: string
          created_at?: string
          guest_id?: string
          hotel_id?: string
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: []
      }
      guest_interactions: {
        Row: {
          ai_response: string | null
          content: string | null
          created_at: string
          escalated: boolean | null
          guest_id: string
          hotel_id: string
          id: string
          intent_detected: string | null
          interaction_source: string
          interaction_type: string
          metadata: Json | null
          reservation_id: string | null
          resolved: boolean | null
          sentiment_score: number | null
          staff_response: string | null
        }
        Insert: {
          ai_response?: string | null
          content?: string | null
          created_at?: string
          escalated?: boolean | null
          guest_id: string
          hotel_id: string
          id?: string
          intent_detected?: string | null
          interaction_source: string
          interaction_type: string
          metadata?: Json | null
          reservation_id?: string | null
          resolved?: boolean | null
          sentiment_score?: number | null
          staff_response?: string | null
        }
        Update: {
          ai_response?: string | null
          content?: string | null
          created_at?: string
          escalated?: boolean | null
          guest_id?: string
          hotel_id?: string
          id?: string
          intent_detected?: string | null
          interaction_source?: string
          interaction_type?: string
          metadata?: Json | null
          reservation_id?: string | null
          resolved?: boolean | null
          sentiment_score?: number | null
          staff_response?: string | null
        }
        Relationships: []
      }
      guest_loyalty_programs: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean | null
          point_value: number
          program_name: string
          redemption_rules: Json
          tier_structure: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          point_value?: number
          program_name: string
          redemption_rules?: Json
          tier_structure?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          point_value?: number
          program_name?: string
          redemption_rules?: Json
          tier_structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      guest_loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          guest_id: string
          id: string
          points: number
          program_id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          guest_id: string
          id?: string
          points: number
          program_id: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          guest_id?: string
          id?: string
          points?: number
          program_id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      guest_preferences: {
        Row: {
          category: string
          created_at: string
          guest_id: string
          id: string
          notes: string | null
          preference_key: string
          preference_value: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          guest_id: string
          id?: string
          notes?: string | null
          preference_key: string
          preference_value: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          guest_id?: string
          id?: string
          notes?: string | null
          preference_key?: string
          preference_value?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      guest_profiles: {
        Row: {
          blacklist_flag: boolean | null
          blacklist_reason: string | null
          communication_preferences: Json | null
          created_at: string
          guest_id: string
          id: string
          loyalty_points: number | null
          loyalty_tier: string | null
          marketing_consent: boolean | null
          preferences: Json | null
          special_requests: string[] | null
          updated_at: string
          vip_status: boolean | null
        }
        Insert: {
          blacklist_flag?: boolean | null
          blacklist_reason?: string | null
          communication_preferences?: Json | null
          created_at?: string
          guest_id: string
          id?: string
          loyalty_points?: number | null
          loyalty_tier?: string | null
          marketing_consent?: boolean | null
          preferences?: Json | null
          special_requests?: string[] | null
          updated_at?: string
          vip_status?: boolean | null
        }
        Update: {
          blacklist_flag?: boolean | null
          blacklist_reason?: string | null
          communication_preferences?: Json | null
          created_at?: string
          guest_id?: string
          id?: string
          loyalty_points?: number | null
          loyalty_tier?: string | null
          marketing_consent?: boolean | null
          preferences?: Json | null
          special_requests?: string[] | null
          updated_at?: string
          vip_status?: boolean | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          hotel_id: string
          id: string
          id_number: string | null
          last_name: string
          nationality: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          hotel_id: string
          id?: string
          id_number?: string | null
          last_name: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          hotel_id?: string
          id?: string
          id_number?: string | null
          last_name?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          phone: string | null
          timezone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          phone?: string | null
          timezone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          phone?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          hotel_id: string
          id: string
          notes: string | null
          room_id: string
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          room_id: string
          status?: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          room_id?: string
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          allotment: number
          created_at: string
          date: string
          hotel_id: string
          id: string
          room_type_id: string
          stop_sell: boolean
        }
        Insert: {
          allotment?: number
          created_at?: string
          date: string
          hotel_id: string
          id?: string
          room_type_id: string
          stop_sell?: boolean
        }
        Update: {
          allotment?: number
          created_at?: string
          date?: string
          hotel_id?: string
          id?: string
          room_type_id?: string
          stop_sell?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "inventory_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total: number
          quantity?: number
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          due_date: string
          entity_id: string
          entity_type: string
          hotel_id: string
          id: string
          invoice_number: string
          issue_date: string
          metadata: Json | null
          notes: string | null
          payment_terms: number | null
          reservation_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          due_date: string
          entity_id: string
          entity_type: string
          hotel_id: string
          id?: string
          invoice_number: string
          issue_date: string
          metadata?: Json | null
          notes?: string | null
          payment_terms?: number | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          due_date?: string
          entity_id?: string
          entity_type?: string
          hotel_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          metadata?: Json | null
          notes?: string | null
          payment_terms?: number | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_reservation_id"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category: string
          completed_date: string | null
          created_at: string
          description: string
          equipment_id: string | null
          estimated_cost: number | null
          hotel_id: string
          id: string
          images: Json | null
          notes: string | null
          priority: string
          reported_by: string | null
          room_id: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category: string
          completed_date?: string | null
          created_at?: string
          description: string
          equipment_id?: string | null
          estimated_cost?: number | null
          hotel_id: string
          id?: string
          images?: Json | null
          notes?: string | null
          priority?: string
          reported_by?: string | null
          room_id?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string
          completed_date?: string | null
          created_at?: string
          description?: string
          equipment_id?: string | null
          estimated_cost?: number | null
          hotel_id?: string
          id?: string
          images?: Json | null
          notes?: string | null
          priority?: string
          reported_by?: string | null
          room_id?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_events: {
        Row: {
          created_at: string
          demand_multiplier: number | null
          description: string | null
          end_date: string
          event_type: string
          expected_impact: string | null
          id: string
          location: string | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          demand_multiplier?: number | null
          description?: string | null
          end_date: string
          event_type: string
          expected_impact?: string | null
          id?: string
          location?: string | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          demand_multiplier?: number | null
          description?: string | null
          end_date?: string
          event_type?: string
          expected_impact?: string | null
          id?: string
          location?: string | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          communication_channel: string
          content: string
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean | null
          subject: string | null
          template_name: string
          template_type: string
          trigger_conditions: Json | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          communication_channel: string
          content: string
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          subject?: string | null
          template_name: string
          template_type: string
          trigger_conditions?: Json | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          communication_channel?: string
          content?: string
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          subject?: string | null
          template_name?: string
          template_type?: string
          trigger_conditions?: Json | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          billing_email: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          billing_email: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          billing_email?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          amount_in_base_currency: number
          created_at: string
          currency: string
          exchange_rate: number | null
          gateway_transaction_id: string | null
          hotel_id: string
          id: string
          invoice_id: string | null
          metadata: Json | null
          notes: string | null
          payment_method: string
          payment_type: string
          processed_at: string | null
          reservation_id: string | null
          status: string
        }
        Insert: {
          amount: number
          amount_in_base_currency: number
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          gateway_transaction_id?: string | null
          hotel_id: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_method: string
          payment_type: string
          processed_at?: string | null
          reservation_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          amount_in_base_currency?: number
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          gateway_transaction_id?: string | null
          hotel_id?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string
          payment_type?: string
          processed_at?: string | null
          reservation_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_reservation_id"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_agreements: {
        Row: {
          agency_id: string
          allotment: number | null
          created_at: string
          currency: string
          discount_percent: number | null
          end_date: string | null
          fixed_rate: number | null
          hotel_id: string
          id: string
          is_active: boolean | null
          name: string
          room_type_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          allotment?: number | null
          created_at?: string
          currency?: string
          discount_percent?: number | null
          end_date?: string | null
          fixed_rate?: number | null
          hotel_id: string
          id?: string
          is_active?: boolean | null
          name: string
          room_type_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          allotment?: number | null
          created_at?: string
          currency?: string
          discount_percent?: number | null
          end_date?: string | null
          fixed_rate?: number | null
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          room_type_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_agreements_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_agreements_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_agreements_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          advance_booking_days: number | null
          blackout_dates: string[] | null
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_value: number
          hotel_id: string
          id: string
          is_active: boolean | null
          max_nights: number | null
          max_uses: number | null
          min_nights: number | null
          name: string
          promotion_type: string
          room_types: string[] | null
          updated_at: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          advance_booking_days?: number | null
          blackout_dates?: string[] | null
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_value: number
          hotel_id: string
          id?: string
          is_active?: boolean | null
          max_nights?: number | null
          max_uses?: number | null
          min_nights?: number | null
          name: string
          promotion_type?: string
          room_types?: string[] | null
          updated_at?: string
          valid_from: string
          valid_to: string
        }
        Update: {
          advance_booking_days?: number | null
          blackout_dates?: string[] | null
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_value?: number
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          max_nights?: number | null
          max_uses?: number | null
          min_nights?: number | null
          name?: string
          promotion_type?: string
          room_types?: string[] | null
          updated_at?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      rate_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          hotel_id: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          hotel_id: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          hotel_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_plans_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_charges: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          folio_split: string | null
          id: string
          posted_at: string
          reservation_id: string
          split_percentage: number | null
          type: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          folio_split?: string | null
          id?: string
          posted_at?: string
          reservation_id: string
          split_percentage?: number | null
          type: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          folio_split?: string | null
          id?: string
          posted_at?: string
          reservation_id?: string
          split_percentage?: number | null
          type?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_charges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_charges_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_groups: {
        Row: {
          created_at: string
          cutoff_date: string | null
          end_date: string
          group_code: string
          group_rate: number | null
          group_type: string
          hotel_id: string
          id: string
          name: string
          notes: string | null
          organizer_email: string | null
          organizer_name: string | null
          organizer_phone: string | null
          room_block_size: number
          rooms_picked_up: number | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cutoff_date?: string | null
          end_date: string
          group_code: string
          group_rate?: number | null
          group_type?: string
          hotel_id: string
          id?: string
          name: string
          notes?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          room_block_size?: number
          rooms_picked_up?: number | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cutoff_date?: string | null
          end_date?: string
          group_code?: string
          group_rate?: number | null
          group_type?: string
          hotel_id?: string
          id?: string
          name?: string
          notes?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          room_block_size?: number
          rooms_picked_up?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          adults: number
          agency_id: string | null
          arrival_time: string | null
          balance_due: number | null
          booking_reference: string | null
          channel_id: string | null
          check_in: string
          check_out: string
          children: number
          code: string
          company_id: string | null
          confirmation_number: string | null
          created_at: string
          currency: string
          departure_time: string | null
          deposit_amount: number | null
          group_id: string | null
          guest_id: string
          hotel_id: string
          id: string
          is_group_master: boolean | null
          notes: string | null
          payment_method: string | null
          promotion_id: string | null
          rate_plan_id: string
          room_id: string | null
          room_type_id: string
          source: string | null
          special_requests: string[] | null
          status: string
          total_amount: number | null
          total_price: number
          updated_at: string
        }
        Insert: {
          adults?: number
          agency_id?: string | null
          arrival_time?: string | null
          balance_due?: number | null
          booking_reference?: string | null
          channel_id?: string | null
          check_in: string
          check_out: string
          children?: number
          code: string
          company_id?: string | null
          confirmation_number?: string | null
          created_at?: string
          currency?: string
          departure_time?: string | null
          deposit_amount?: number | null
          group_id?: string | null
          guest_id: string
          hotel_id: string
          id?: string
          is_group_master?: boolean | null
          notes?: string | null
          payment_method?: string | null
          promotion_id?: string | null
          rate_plan_id: string
          room_id?: string | null
          room_type_id: string
          source?: string | null
          special_requests?: string[] | null
          status?: string
          total_amount?: number | null
          total_price: number
          updated_at?: string
        }
        Update: {
          adults?: number
          agency_id?: string | null
          arrival_time?: string | null
          balance_due?: number | null
          booking_reference?: string | null
          channel_id?: string | null
          check_in?: string
          check_out?: string
          children?: number
          code?: string
          company_id?: string | null
          confirmation_number?: string | null
          created_at?: string
          currency?: string
          departure_time?: string | null
          deposit_amount?: number | null
          group_id?: string | null
          guest_id?: string
          hotel_id?: string
          id?: string
          is_group_master?: boolean | null
          notes?: string | null
          payment_method?: string | null
          promotion_id?: string | null
          rate_plan_id?: string
          room_id?: string | null
          room_type_id?: string
          source?: string | null
          special_requests?: string[] | null
          status?: string
          total_amount?: number | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_rate_plan_id_fkey"
            columns: ["rate_plan_id"]
            isOneToOne: false
            referencedRelation: "rate_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      room_maintenance: {
        Row: {
          actual_completion: string | null
          assigned_to: string | null
          cost: number | null
          created_at: string
          description: string | null
          end_date: string | null
          estimated_completion: string | null
          id: string
          maintenance_type: string
          notes: string | null
          priority: string | null
          reason: string
          reported_by: string | null
          room_id: string
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          actual_completion?: string | null
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_completion?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          priority?: string | null
          reason: string
          reported_by?: string | null
          room_id: string
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          actual_completion?: string | null
          assigned_to?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_completion?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          priority?: string | null
          reason?: string
          reported_by?: string | null
          room_id?: string
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      room_types: {
        Row: {
          capacity_adults: number
          capacity_children: number
          code: string
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          name: string
        }
        Insert: {
          capacity_adults?: number
          capacity_children?: number
          code: string
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          name: string
        }
        Update: {
          capacity_adults?: number
          capacity_children?: number
          code?: string
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          floor: number | null
          hotel_id: string
          housekeeping_status: string
          id: string
          number: string
          room_type_id: string
          status: string
        }
        Insert: {
          created_at?: string
          floor?: number | null
          hotel_id: string
          housekeeping_status?: string
          id?: string
          number: string
          room_type_id: string
          status?: string
        }
        Update: {
          created_at?: string
          floor?: number | null
          hotel_id?: string
          housekeeping_status?: string
          id?: string
          number?: string
          room_type_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          guest_feedback: string | null
          guest_id: string
          guest_rating: number | null
          hotel_id: string
          id: string
          notes: string | null
          priority: string | null
          requested_time: string | null
          reservation_id: string
          room_number: string
          service_category: string | null
          service_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          guest_feedback?: string | null
          guest_id: string
          guest_rating?: number | null
          hotel_id: string
          id?: string
          notes?: string | null
          priority?: string | null
          requested_time?: string | null
          reservation_id: string
          room_number: string
          service_category?: string | null
          service_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          guest_feedback?: string | null
          guest_id?: string
          guest_rating?: number | null
          hotel_id?: string
          id?: string
          notes?: string | null
          priority?: string | null
          requested_time?: string | null
          reservation_id?: string
          room_number?: string
          service_category?: string | null
          service_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          department: string
          email: string | null
          employee_id: string
          first_name: string
          hire_date: string
          hotel_id: string
          hourly_rate: number | null
          id: string
          last_name: string
          permissions: Json | null
          phone: string | null
          position: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          employee_id: string
          first_name: string
          hire_date: string
          hotel_id: string
          hourly_rate?: number | null
          id?: string
          last_name: string
          permissions?: Json | null
          phone?: string | null
          position: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          employee_id?: string
          first_name?: string
          hire_date?: string
          hotel_id?: string
          hourly_rate?: number | null
          id?: string
          last_name?: string
          permissions?: Json | null
          phone?: string | null
          position?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          created_at: string
          department: string
          hotel_id: string
          id: string
          notes: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          hotel_id: string
          id?: string
          notes?: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          shift_date?: string
          shift_end?: string
          shift_start?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          id: string
          name: string
          org_id: string
          role: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          org_id: string
          role: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          adults: number
          check_in: string
          check_out: string
          children: number | null
          created_at: string
          guest_id: string
          hotel_id: string
          id: string
          notes: string | null
          priority: number | null
          room_type_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          adults?: number
          check_in: string
          check_out: string
          children?: number | null
          created_at?: string
          guest_id: string
          hotel_id: string
          id?: string
          notes?: string | null
          priority?: number | null
          room_type_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          adults?: number
          check_in?: string
          check_out?: string
          children?: number | null
          created_at?: string
          guest_id?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          priority?: number | null
          room_type_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
