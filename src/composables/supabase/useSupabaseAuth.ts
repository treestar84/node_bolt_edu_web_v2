import { supabase } from './useSupabaseClient';

export function useSupabaseAuth() {
  // Auth helpers - Enhanced with better session management
  async function signUp(username: string, password: string, userType: string, childName: string, childBirthDate: string, childAgeMonths: number) {
    try {
      console.log('🚀 Starting signup process for:', username);
      console.log('📋 Signup parameters:', { username, userType, childName, childBirthDate, childAgeMonths });
      
      // Create a fake email from username for Supabase
      const email = `${username}@local.app`;
      
      console.log('📧 Creating auth user with email:', email);
      
      // Sign up with email confirmation disabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            username: username,
            user_type: userType,
            child_name: childName,
            child_birth_date: childBirthDate,
            child_age_months: childAgeMonths,
            email_confirm: false // Custom flag to indicate no email confirmation needed
          }
        }
      });

      if (error) {
        console.error('❌ Auth signup error:', error);
        
        // Handle specific email rate limit error
        if (error.message.includes('rate limit') || error.message.includes('email rate limit')) {
          throw new Error('회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          throw new Error('이미 사용 중인 아이디입니다.');
        } else if (error.message.includes('Password') || error.message.includes('password')) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
        }
        
        throw error;
      }

      console.log('✅ Auth user created:', data.user?.id);
      console.log('📊 Session data:', data.session ? 'Session created' : 'No session');

      if (data.user) {
        // For users created without email confirmation, they should be immediately available
        console.log('👤 User created successfully, proceeding with profile creation...');
        
        try {
          // Wait a moment for the user to be fully created
          console.log('⏳ Waiting for user to be fully created...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // If no session was created (email confirmation required), try to sign in
          if (!data.session) {
            console.log('🔐 No session created, attempting to sign in...');
            const { data: _signInResult, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (signInError) {
              console.error('❌ Auto sign-in failed:', signInError);
              throw new Error('계정이 생성되었지만 로그인에 실패했습니다. 수동으로 로그인해주세요.');
            }
            
            console.log('✅ Auto sign-in successful');
          }
          
          console.log('🔍 Checking current auth session...');
          const { data: sessionData } = await supabase.auth.getSession();
          console.log('📊 Current session:', sessionData.session?.user?.id);
          
          // Verify the user is properly authenticated
          const { data: currentUser } = await supabase.auth.getUser();
          console.log('👤 Current authenticated user:', currentUser.user?.id);
          
          if (!currentUser.user) {
            console.error('❌ User not properly authenticated after signup');
            throw new Error('사용자 인증에 실패했습니다. 수동으로 로그인해주세요.');
          }
          
          console.log('👤 Creating user profile...');
          
          // Create user profile with detailed logging - FIXED: use snake_case for database
          const profileData = {
            user_id: data.user.id,
            username,
            user_type: userType,
            child_name: childName,
            child_birth_date: childBirthDate,
            child_age_months: childAgeMonths,
            site_name: '유아학습'
          };
          
          console.log('📝 Profile data to insert:', profileData);
          console.log('🔑 Using user ID:', data.user.id);
          console.log('🔑 Auth UID should be:', currentUser.user.id);
          
          // Test RLS by trying a simple query first
          console.log('🧪 Testing RLS access...');
          try {
            const { data: testData, error: testError } = await supabase
              .from('user_profiles')
              .select('count')
              .limit(1);
            
            console.log('🧪 RLS test result:', { testData, testError });
          } catch (testErr) {
            console.error('🧪 RLS test failed:', testErr);
          }
          
          // Try inserting the profile
          const { data: profileResult, error: profileError } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();

          if (profileError) {
            console.error('❌ Profile creation error details:', {
              error: profileError,
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint
            });
            
            // Enhanced error handling with specific solutions
            if (profileError.code === '42501') {
              console.error('🔒 RLS Policy Error - checking auth state...');
              const { data: authCheck } = await supabase.auth.getUser();
              console.error('🔍 Auth check result:', authCheck.user?.id);
              throw new Error('데이터베이스 권한 오류입니다. 관리자에게 문의하세요.');
            } else if (profileError.code === '23505') {
              throw new Error('이미 사용 중인 아이디입니다.');
            } else if (profileError.code === 'PGRST301') {
              throw new Error('데이터베이스 연결 오류입니다. 잠시 후 다시 시도해주세요.');
            } else {
              throw new Error(`프로필 생성 실패: ${profileError.message}`);
            }
          }

          console.log('✅ Profile created successfully:', profileResult);

          // Initialize user progress with better error handling
          console.log('📊 Creating user progress...');
          const progressData = {
            user_id: data.user.id,
            quiz_score: 0,
            quiz_streak: 0,
            puzzle_completions: 0,
            words_learned: 0,
            books_read: 0
          };
          
          console.log('📈 Progress data to insert:', progressData);
          
          const { data: progressResult, error: progressError } = await supabase
            .from('user_progress')
            .insert(progressData)
            .select()
            .single();

          if (progressError) {
            console.error('⚠️ Progress creation error (non-critical):', progressError);
            // Don't throw error for progress, it's not critical for signup
          } else {
            console.log('✅ Progress created successfully:', progressResult);
          }
          
        } catch (profileError) {
          console.error('💥 Error in profile creation process:', profileError);
          
          // Enhanced cleanup process
          console.log('🧹 Cleaning up auth user due to profile creation failure...');
          try {
            // First try to delete the user profile if it was partially created
            await supabase
              .from('user_profiles')
              .delete()
              .eq('user_id', data.user.id);
            
            // Then sign out
            await supabase.auth.signOut();
            console.log('✅ Auth user cleaned up');
          } catch (cleanupError) {
            console.error('❌ Failed to cleanup auth user:', cleanupError);
          }
          
          throw profileError;
        }
      }

      console.log('🎉 Signup process completed successfully');
      return data;
    } catch (error) {
      console.error('💥 SignUp error:', error);
      throw error;
    }
  }

  async function signIn(username: string, password: string) {
    try {
      console.log('🔐 Starting signin process for:', username);
      
      // Convert username to email format for Supabase
      const email = `${username}@local.app`;
      
      console.log('📧 Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth signin error:', error);
        
        // Handle specific errors
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('이메일 인증이 필요합니다. 관리자에게 문의하세요.');
        }
        
        throw error;
      }
      
      console.log('✅ Signin successful:', data.user?.id);
      return data;
    } catch (error) {
      console.error('💥 SignIn error:', error);
      throw error;
    }
  }

  async function signOut() {
    console.log('👋 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Signout error:', error);
      throw error;
    }
    console.log('✅ Signout successful');
  }

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Enhanced username check with better error handling
  async function checkUsernameExists(username: string) {
    try {
      console.log('🔍 Checking if username exists:', username);
      
      // First check if we can access the table at all
      const { data: _testAccessResult, error: accessError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (accessError) {
        console.error('❌ Cannot access user_profiles table:', accessError);
        return false; // Assume username doesn't exist if we can't check
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error) {
        console.log('📝 Username check error:', error);
        if (error.code === 'PGRST116') {
          // No rows returned - username doesn't exist
          console.log('✅ Username available');
          return false;
        } else {
          console.error('❌ Unexpected error checking username:', error);
          return false; // Assume username doesn't exist if we can't check
        }
      }
      
      console.log('⚠️ Username already exists');
      return !!data;
    } catch (error) {
      console.error('💥 Username check error:', error);
      return false;
    }
  }

  return {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    checkUsernameExists
  };
}