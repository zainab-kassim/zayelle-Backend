export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: number;
          created_at: string;
          id: number;
          price: number | null;
          product_id: number | null;
          quantity: number | null;
          size: string | null;
          unitprice: number | null;
        };
        Insert: {
          cart_id: number;
          created_at?: string;
          id?: number;
          price?: number | null;
          product_id?: number | null;
          quantity?: number | null;
          size?: string | null;
          unitprice?: number | null;
        };
        Update: {
          cart_id?: number;
          created_at?: string;
          id?: number;
          price?: number | null;
          product_id?: number | null;
          quantity?: number | null;
          size?: string | null;
          unitprice?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: number;
          user_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          user_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      collections: {
        Row: {
          description: string;
          id: number;
          image: string;
          name: string;
          slug: string | null;
        };
        Insert: {
          description: string;
          id?: number;
          image: string;
          name: string;
          slug?: string | null;
        };
        Update: {
          description?: string;
          id?: number;
          image?: string;
          name?: string;
          slug?: string | null;
        };
        Relationships: [];
      };
      order: {
        Row: {
          apt_no: string | null;
          cart_id: number | null;
          checkoutSession_id: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          currency: string | null;
          id: number;
          phone_number: string | null;
          postal_code: string | null;
          rate: number | null;
          reference: string | null;
          state: string | null;
          status: string[] | null;
          street_address: string | null;
          total_price: number | null;
          totalLocal: number | null;
          user_id: number | null;
        };
        Insert: {
          apt_no?: string | null;
          cart_id?: number | null;
          checkoutSession_id?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          id?: number;
          phone_number?: string | null;
          postal_code?: string | null;
          rate?: number | null;
          reference?: string | null;
          state?: string | null;
          status?: string[] | null;
          street_address?: string | null;
          total_price?: number | null;
          totalLocal?: number | null;
          user_id?: number | null;
        };
        Update: {
          apt_no?: string | null;
          cart_id?: number | null;
          checkoutSession_id?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          id?: number;
          phone_number?: string | null;
          postal_code?: string | null;
          rate?: number | null;
          reference?: string | null;
          state?: string | null;
          status?: string[] | null;
          street_address?: string | null;
          total_price?: number | null;
          totalLocal?: number | null;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          cart_id: number | null;
          created_at: string;
          id: number;
          order_id: number | null;
          price: number | null;
          product_id: number | null;
          quantity: number | null;
          size: string | null;
          unit_price: number | null;
        };
        Insert: {
          cart_id?: number | null;
          created_at?: string;
          id?: number;
          order_id?: number | null;
          price?: number | null;
          product_id?: number | null;
          quantity?: number | null;
          size?: string | null;
          unit_price?: number | null;
        };
        Update: {
          cart_id?: number | null;
          created_at?: string;
          id?: number;
          order_id?: number | null;
          price?: number | null;
          product_id?: number | null;
          quantity?: number | null;
          size?: string | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'order';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          collectionid: number;
          created_at: string | null;
          description: string;
          id: number;
          image: string[];
          name: string;
          price: number;
          quantity: number;
          size: string[];
          slug: string | null;
        };
        Insert: {
          collectionid: number;
          created_at?: string | null;
          description: string;
          id?: number;
          image: string[];
          name: string;
          price: number;
          quantity: number;
          size: string[];
          slug?: string | null;
        };
        Update: {
          collectionid?: number;
          created_at?: string | null;
          description?: string;
          id?: number;
          image?: string[];
          name?: string;
          price?: number;
          quantity?: number;
          size?: string[];
          slug?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_collectionid_fkey';
            columns: ['collectionid'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          firstname: string;
          id: number;
          lastname: string;
          password: string;
          phonenumber: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          firstname: string;
          id?: number;
          lastname: string;
          password: string;
          phonenumber: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          firstname?: string;
          id?: number;
          lastname?: string;
          password?: string;
          phonenumber?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
