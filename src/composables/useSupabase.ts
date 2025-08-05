// Re-export the supabase client for backward compatibility
export { supabase } from './supabase/useSupabaseClient';

// Import all decomposed composables
import { useSupabaseClient } from './supabase/useSupabaseClient';
import { useSupabaseAuth } from './supabase/useSupabaseAuth';
import { useSupabaseProfiles } from './supabase/useSupabaseProfiles';
import { useSupabaseWords } from './supabase/useSupabaseWords';
import { useSupabaseBooks } from './supabase/useSupabaseBooks';
import { useSupabaseProgress } from './supabase/useSupabaseProgress';
import { useSupabaseBadges } from './supabase/useSupabaseBadges';

export function useSupabase() {
  // Get all composable functions
  const { supabase, testDatabaseConnection } = useSupabaseClient();
  const authFunctions = useSupabaseAuth();
  const profileFunctions = useSupabaseProfiles();
  const wordsFunctions = useSupabaseWords();
  const booksFunctions = useSupabaseBooks();
  const progressFunctions = useSupabaseProgress();
  const badgesFunctions = useSupabaseBadges();

  return {
    supabase,
    
    // Database connection test
    testDatabaseConnection,
    
    // Auth functions
    ...authFunctions,
    
    // Profile functions
    ...profileFunctions,
    
    // Words functions
    ...wordsFunctions,
    
    // Books functions
    ...booksFunctions,
    
    // Progress functions
    ...progressFunctions,
    
    // Badges functions
    ...badgesFunctions
  };
}