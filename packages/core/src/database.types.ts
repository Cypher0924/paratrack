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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string | null
          created_at: string
          id: number
          route_id: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: number
          route_id?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: number
          route_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_verify_attempts: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          operator_id: string
          user_id: string
          vehicle_id: string | null
          verified_at: string
        }
        Insert: {
          operator_id: string
          user_id: string
          vehicle_id?: string | null
          verified_at?: string
        }
        Update: {
          operator_id?: string
          user_id?: string
          vehicle_id?: string | null
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: number
          kind: Database["public"]["Enums"]["notification_kind"] | null
          read_at: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: number
          kind?: Database["public"]["Enums"]["notification_kind"] | null
          read_at?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: number
          kind?: Database["public"]["Enums"]["notification_kind"] | null
          read_at?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          code: string
          id: string
          name: string | null
        }
        Insert: {
          code: string
          id?: string
          name?: string | null
        }
        Update: {
          code?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_minutes: number
          arrival_alerts: boolean
          created_at: string
          display_name: string | null
          fare_type: Database["public"]["Enums"]["fare_type"]
          id: string
          service_updates: boolean
        }
        Insert: {
          alert_minutes?: number
          arrival_alerts?: boolean
          created_at?: string
          display_name?: string | null
          fare_type?: Database["public"]["Enums"]["fare_type"]
          id: string
          service_updates?: boolean
        }
        Update: {
          alert_minutes?: number
          arrival_alerts?: boolean
          created_at?: string
          display_name?: string | null
          fare_type?: Database["public"]["Enums"]["fare_type"]
          id?: string
          service_updates?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          keys: Json | null
          kind: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keys?: Json | null
          kind: string
          token: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          keys?: Json | null
          kind?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          offset_m: number
          route_id: string
          seq: number
          stop_id: string
        }
        Insert: {
          offset_m: number
          route_id: string
          seq: number
          stop_id: string
        }
        Update: {
          offset_m?: number
          route_id?: string
          seq?: number
          stop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          active: boolean
          base_fare: number | null
          base_km: number | null
          color: string | null
          geom: unknown
          headway_min: number | null
          id: string
          length_m: number
          name: string | null
          per_km: number | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          active?: boolean
          base_fare?: number | null
          base_km?: number | null
          color?: string | null
          geom: unknown
          headway_min?: number | null
          id?: string
          length_m: number
          name?: string | null
          per_km?: number | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          active?: boolean
          base_fare?: number | null
          base_km?: number | null
          color?: string | null
          geom?: unknown
          headway_min?: number | null
          id?: string
          length_m?: number
          name?: string | null
          per_km?: number | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          id: string
          label: string | null
          stop_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          label?: string | null
          stop_id?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          label?: string | null
          stop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_routes: {
        Row: {
          route_id: string
          user_id: string
        }
        Insert: {
          route_id: string
          user_id?: string
        }
        Update: {
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_routes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      stops: {
        Row: {
          geom: unknown
          id: string
          name: string | null
        }
        Insert: {
          geom?: unknown
          id?: string
          name?: string | null
        }
        Update: {
          geom?: unknown
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          alight_stop_id: string | null
          arrival_alert: boolean
          arrival_sent_at: string | null
          board_stop_id: string | null
          created_at: string
          full_sent_at: string | null
          id: string
          para_alert: boolean
          para_sent_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          alight_stop_id?: string | null
          arrival_alert?: boolean
          arrival_sent_at?: string | null
          board_stop_id?: string | null
          created_at?: string
          full_sent_at?: string | null
          id?: string
          para_alert?: boolean
          para_sent_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          user_id?: string
          vehicle_id?: string | null
        }
        Update: {
          alight_stop_id?: string | null
          arrival_alert?: boolean
          arrival_sent_at?: string | null
          board_stop_id?: string | null
          created_at?: string
          full_sent_at?: string | null
          id?: string
          para_alert?: boolean
          para_sent_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_alight_stop_id_fkey"
            columns: ["alight_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_board_stop_id_fkey"
            columns: ["board_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_live: {
        Row: {
          accuracy: number | null
          heading: number | null
          lat: number | null
          lng: number | null
          marked_full: boolean
          online: boolean
          progress_m: number
          seats_taken: number
          speed_mps: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          accuracy?: number | null
          heading?: number | null
          lat?: number | null
          lng?: number | null
          marked_full?: boolean
          online?: boolean
          progress_m?: number
          seats_taken?: number
          speed_mps?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          accuracy?: number | null
          heading?: number | null
          lat?: number | null
          lng?: number | null
          marked_full?: boolean
          online?: boolean
          progress_m?: number
          seats_taken?: number
          speed_mps?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_live_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          id: string
          label: string | null
          operator_id: string
          plate: string | null
          route_id: string
        }
        Insert: {
          capacity: number
          id?: string
          label?: string | null
          operator_id: string
          plate?: string | null
          route_id: string
        }
        Update: {
          capacity?: number
          id?: string
          label?: string | null
          operator_id?: string
          plate?: string | null
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      driver_ping: {
        Args: {
          p_accuracy?: number
          p_heading?: number
          p_lat: number
          p_lng: number
          p_speed?: number
        }
        Returns: Json
      }
      driver_set_seats: {
        Args: { p_count?: number; p_full?: boolean }
        Returns: Json
      }
      end_shift: { Args: never; Returns: Json }
      run_cron_job: { Args: { p_name: string }; Returns: undefined }
      start_shift: { Args: never; Returns: Json }
      tracking_count: { Args: { p_vehicle_id: string }; Returns: number }
      verify_driver: {
        Args: { p_operator_code: string; p_plate: string }
        Returns: Json
      }
    }
    Enums: {
      fare_type: "regular" | "student" | "senior" | "pwd"
      notification_kind: "arrival" | "service"
      trip_status: "tracking" | "onboard" | "ended"
      vehicle_type: "jeep" | "ejeep" | "bus" | "shuttle"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fare_type: ["regular", "student", "senior", "pwd"],
      notification_kind: ["arrival", "service"],
      trip_status: ["tracking", "onboard", "ended"],
      vehicle_type: ["jeep", "ejeep", "bus", "shuttle"],
    },
  },
} as const
