import { supabase } from './useSupabaseClient';

export function useSupabaseProfiles() {
  // Profile helpers - FIXED: Transform between camelCase and snake_case
  async function getUserProfile(userId: string) {
    console.log('👤 Getting user profile for:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
    
    // Transform snake_case to camelCase for frontend
    const transformedData = {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      userType: data.user_type,
      siteName: data.site_name,
      mainImageUrl: data.main_image_url,
      childAge: data.child_age, // FIXED: Transform from snake_case
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    console.log('✅ Profile retrieved and transformed:', transformedData);
    return transformedData;
  }

  async function updateUserProfile(userId: string, updates: Partial<any>) {
    console.log('📝 Updating user profile for:', userId, updates);
    
    // Transform camelCase to snake_case for database
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    
    if (updates.userType) dbUpdates.user_type = updates.userType;
    if (updates.siteName) dbUpdates.site_name = updates.siteName;
    if (updates.mainImageUrl !== undefined) dbUpdates.main_image_url = updates.mainImageUrl;
    if (updates.childAge) dbUpdates.child_age = updates.childAge; // FIXED: Transform to snake_case
    
    console.log('📝 Database updates (snake_case):', dbUpdates);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
    
    // Transform back to camelCase for frontend
    const transformedData = {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      userType: data.user_type,
      siteName: data.site_name,
      mainImageUrl: data.main_image_url,
      childAge: data.child_age, // FIXED: Transform from snake_case
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    console.log('✅ Profile updated and transformed:', transformedData);
    return transformedData;
  }

  return {
    getUserProfile,
    updateUserProfile
  };
}