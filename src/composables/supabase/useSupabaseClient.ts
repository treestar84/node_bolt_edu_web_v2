import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
});

export function useSupabaseClient() {
  // Enhanced connection test
  async function testDatabaseConnection() {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test 1: Basic connection
      const { error: basicError } = await supabase
        .from('badges')
        .select('count');
      
      // Test 2: Public table access (badges)
      const { error: publicError } = await supabase
        .from('badges')
        .select('id')
        .limit(1);
      
      // Test 3: User-specific table access (if authenticated)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        return {
          success: true,
          tests: {
            basic: !basicError,
            public: !publicError,
            user: !userError
          }
        };
      }
      
      return {
        success: !basicError && !publicError,
        tests: {
          basic: !basicError,
          public: !publicError,
          user: null
        }
      };
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  return {
    supabase,
    testDatabaseConnection
  };
}