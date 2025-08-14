import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import type { WordItem, Book, Badge, ApiKey, Language } from '@/types';
import { changeLanguageWithEvent, getCurrentLanguage } from '@/utils/i18n';

export const useAppStore = defineStore('app', () => {
  const { supabase } = useSupabase();
  
  // Language state - i18n 시스템과 동기화
  const currentLanguage = ref<Language>(getCurrentLanguage());
  
  // Words state - 공용 콘텐츠 우선 로드
  const currentWords = ref<WordItem[]>([]);

  // Books state - 공용 콘텐츠 우선 로드
  const currentBooks = ref<Book[]>([]);

  // Quiz state
  const quizScore = ref(0);
  const quizStreak = ref(0);

  // Puzzle state
  const puzzleCompletions = ref(0);

  // Badge state
  const currentBadges = ref<Badge[]>([]);

  // Admin state
  const isAdminLoggedIn = ref(false);
  const adminToken = ref<string>('');

  // API Keys state
  const apiKeys = ref<ApiKey[]>([]);

  // Computed properties
  const wordsByCategory = computed(() => {
    const grouped: Record<string, WordItem[]> = {};
    currentWords.value.forEach(word => {
      if (!grouped[word.category]) {
        grouped[word.category] = [];
      }
      grouped[word.category].push(word);
    });
    return grouped;
  });

  const availableBadges = computed(() => {
    return currentBadges.value.filter(badge => badge.unlocked);
  });

  const nextBadge = computed(() => {
    
    const lockedBadges = currentBadges.value.filter(b => !b.unlocked);
    
    if (lockedBadges.length === 0) return null;
    
    return lockedBadges.reduce((next, badge) => {
      if (!next || badge.requiredScore < next.requiredScore) {
        return badge;
      }
      return next;
    });
  });

  // Actions
  const setLanguage = async (language: Language) => {
    console.log(`🌐 Changing language from ${currentLanguage.value} to ${language}`);
    
    const success = await changeLanguageWithEvent(language);
    if (success) {
      currentLanguage.value = language;
      console.log(`✅ Language successfully changed to ${language}`);
    } else {
      console.error(`❌ Failed to change language to ${language}`);
    }
    
    return success;
  };

  // 공용 콘텐츠 우선 로드 (인증 없이도 접근 가능) - 개선된 버전
  const loadWords = async () => {
    try {
      console.log('📚 Loading words from database (all words, no owner_type restriction)...');
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Error loading words:', error);
        currentWords.value = [];
        return;
      }
      currentWords.value = (data || []).map(transformWordFromDB);
      console.log('✅ Words loaded:', currentWords.value.length, currentWords.value.map(w => w.id));
    } catch (error) {
      console.error('💥 Error in loadWords:', error);
      currentWords.value = [];
    }
  };

  // 공용 책 우선 로드 (인증 없이도 접근 가능)
  const loadBooks = async () => {
    try {
      console.log('📖 Loading books from API server...');
      const response = await fetch('/api/books');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error('Failed to load books from API');
      }
      currentBooks.value = result.data || [];
      console.log('✅ Books loaded:', currentBooks.value.length);
    } catch (error) {
      console.error('💥 Error loading books:', error);
      currentBooks.value = [];
    }
  };

  // 뱃지 로드 (공용 접근) - 개선된 버전
  const loadBadges = async () => {
    try {
      console.log('🏆 Loading badges...');
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('required_score');

      if (error) {
        console.error('❌ Error loading badges:', error);
        currentBadges.value = [];
        return;
      }

      currentBadges.value = (data || []).map(badge => ({
        ...badge,
        unlocked: false // 초기에는 모든 뱃지가 잠금 상태
      }));
      console.log('✅ Badges loaded:', currentBadges.value.length);
    } catch (error) {
      console.error('💥 Error in loadBadges:', error);
      currentBadges.value = [];
    }
  };

  // 모든 공용 데이터 로드 (인증 없이도 접근 가능) - 강화된 버전
  const loadAllData = async () => {
    console.log('🔄 Loading all public data from database...');
    
    // 병렬로 로드하되, 각각 독립적으로 실행하여 하나가 실패해도 다른 것들은 로드되도록 함
    const loadPromises = [
      loadWords().catch(err => console.error('Words loading failed:', err)),
      loadBooks().catch(err => console.error('Books loading failed:', err)),
      loadBadges().catch(err => console.error('Badges loading failed:', err))
    ];
    
    await Promise.allSettled(loadPromises);
    console.log('✅ All public data loading completed');
    
    // 최종 상태 로그
    console.log('📊 Final data state:', {
      words: currentWords.value.length,
      books: currentBooks.value.length,
      badges: currentBadges.value.length
    });
  };

  // 인증된 사용자용 개인화된 데이터 로드
  const loadPersonalizedData = async (userId: string, childAge: number) => {
    try {
      console.log('👤 Loading personalized data for user:', userId, 'age:', childAge);
      
      // 공용 + 개인 단어 로드
      const { data: wordsData, error: wordsError } = await supabase
        .from('words')
        .select('*')
        .or(`owner_type.eq.global,owner_id.eq.${userId}`)
        .lte('min_age', childAge)
        .gte('max_age', childAge)
        .order('owner_type', { ascending: false }) // global 먼저
        .order('created_at', { ascending: false });

      if (!wordsError && wordsData) {
        currentWords.value = wordsData.map(transformWordFromDB);
        console.log('✅ Personalized words loaded:', currentWords.value.length);
      }

      // 공용 + 개인 책 로드
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          *,
          book_pages (*)
        `)
        .or(`owner_type.eq.global,owner_id.eq.${userId}`)
        .lte('min_age', childAge)
        .gte('max_age', childAge)
        .order('owner_type', { ascending: false }) // global 먼저
        .order('created_at', { ascending: false });

      if (!booksError && booksData) {
        currentBooks.value = booksData.map(transformBookFromDB);
        console.log('✅ Personalized books loaded:', currentBooks.value.length);
      }

    } catch (error) {
      console.error('💥 Error loading personalized data:', error);
    }
  };

  // 단어 추가 (관리자 권한 확인 개선)
  const addWord = async (word: Omit<WordItem, 'id'>) => {
    if (!word.imageUrl || word.imageUrl === '') {
      throw new Error('이미지는 필수입니다.');
    }
    // 음성 파일은 선택이므로 필수 체크 제거
    try {
      console.log('➕ Adding word to database:', word.name);
      
      // 관리자 권한 확인을 위해 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      let ownerId = null;
      let ownerType = 'user'; // 항상 'user'로 저장
      if (user) {
        ownerId = user.id;
        // 사용자 프로필 확인 (로그인한 경우만)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        if (profileError) {
          console.error('❌ Error getting user profile:', profileError);
          throw new Error('사용자 프로필을 확인할 수 없습니다.');
        }
        ownerType = (profile.user_type === 'teacher' || profile.user_type === 'admin') ? 'global' : 'user';
      }

      console.log('👤 User type:', ownerType);

      const insertData = {
        name: word.name,
        name_en: word.nameEn,
        image_url: word.imageUrl,
        audio_ko: word.audioKo,
        audio_en: word.audioEn,
        category: word.category,
        min_age: word.minAge || 3,
        max_age: word.maxAge || 6,
        owner_type: ownerType,
        owner_id: ownerId,
        translations: (word as any).translations ? JSON.stringify((word as any).translations) : null,
        auto_translated: (word as any).autoTranslated || false
      };
      
      console.log('📝 Inserting word data:', insertData);

      const { data, error } = await supabase
        .from('words')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding word:', error);
        throw error;
      }

      // 로컬 상태 업데이트
      const newWord = transformWordFromDB(data);
      currentWords.value.unshift(newWord);
      
      console.log('✅ Word added successfully:', newWord.name);
      return newWord;
    } catch (error) {
      console.error('💥 Error in addWord:', error);
      throw error;
    }
  };

  // 단어 수정
  const updateWord = async (id: string, updates: Partial<WordItem>) => {
    // 이미지만 필수, 음성은 TTS로 대체 가능하므로 선택사항
    if (updates.imageUrl !== undefined && (!updates.imageUrl || updates.imageUrl === '')) {
      throw new Error('이미지는 필수입니다.');
    }
    try {
      console.log('📝 Updating word in database:', id);
      
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.nameEn) dbUpdates.name_en = updates.nameEn;
      if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
      if (updates.audioKo !== undefined) dbUpdates.audio_ko = updates.audioKo;
      if (updates.audioEn !== undefined) dbUpdates.audio_en = updates.audioEn;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.minAge) dbUpdates.min_age = updates.minAge;
      if (updates.maxAge) dbUpdates.max_age = updates.maxAge;
      if (updates.ownerType) dbUpdates.owner_type = updates.ownerType;
      if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;

      const { data, error } = await supabase
        .from('words')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating word:', error);
        throw error;
      }

      // 로컬 상태 업데이트
      const index = currentWords.value.findIndex(w => w.id === id);
      if (index !== -1) {
        currentWords.value[index] = transformWordFromDB(data);
      }
      
      console.log('✅ Word updated successfully');
      return transformWordFromDB(data);
    } catch (error) {
      console.error('💥 Error in updateWord:', error);
      throw error;
    }
  };

  // 단어 삭제
  const deleteWord = async (id: string) => {
    try {
      console.log('🗑️ Deleting word from database:', id);
      
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting word:', error);
        throw error;
      }

      // 로컬 상태 업데이트
      currentWords.value = currentWords.value.filter(w => w.id !== id);
      
      console.log('✅ Word deleted successfully');
      return true;
    } catch (error) {
      console.error('💥 Error in deleteWord:', error);
      throw error;
    }
  };

  // 책 추가 (관리자 권한 확인 개선)
  const addBook = async (book: Omit<Book, 'id'>) => {
    try {
      console.log('📚 Adding book via API server:', book.title);
      
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify(book)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to add book');
      }

      const newBook = result.data;
      currentBooks.value.unshift(newBook);
      console.log('✅ Book added successfully:', newBook.id);
      return newBook;
    } catch (error: any) {
      console.error('💥 Error in addBook:', error, error?.details, error?.hint);
      throw error;
    }
  };

  // 책 수정
  const updateBook = async (id: string, updates: Partial<Book>) => {
    try {
      console.log('📝 Updating book via API server:', id);

      const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update book');
      }

      const updatedBook = result.data;
      const index = currentBooks.value.findIndex(b => b.id === id);
      if (index !== -1) {
        currentBooks.value[index] = updatedBook;
      }

      console.log('✅ Book updated successfully:', updatedBook.id);
      return updatedBook;
    } catch (error) {
      console.error('💥 Error in updateBook:', error);
      throw error;
    }
  };

  // 책 삭제
  const deleteBook = async (id: string) => {
    try {
      console.log('🗑️ Deleting book via API server:', id);
      
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete book');
      }

      // 로컬 상태 업데이트
      currentBooks.value = currentBooks.value.filter(b => b.id !== id);
      
      console.log('✅ Book deleted successfully');
      return true;
    } catch (error) {
      console.error('💥 Error in deleteBook:', error);
      throw error;
    }
  };

  // 데이터 변환 함수들
  const transformWordFromDB = (dbWord: any): WordItem => ({
    id: dbWord.id,
    name: dbWord.name,
    nameEn: dbWord.name_en,
    imageUrl: dbWord.image_url,
    audioKo: dbWord.audio_ko,
    audioEn: dbWord.audio_en,
    category: dbWord.category,
    minAge: dbWord.min_age,
    maxAge: dbWord.max_age,
    ownerType: dbWord.owner_type,
    ownerId: dbWord.owner_id,
    createdAt: dbWord.created_at,
    updatedAt: dbWord.updated_at,
    ...(dbWord.translations && { translations: dbWord.translations }),
    ...(dbWord.auto_translated !== undefined && { autoTranslated: dbWord.auto_translated })
  });

  const transformBookFromDB = (dbBook: any): Book => ({
    id: dbBook.id,
    title: dbBook.title,
    coverImage: dbBook.cover_image,
    minAge: dbBook.min_age,
    maxAge: dbBook.max_age,
    ownerType: dbBook.owner_type,
    ownerId: dbBook.owner_id,
    isVideoMode: dbBook.is_video_mode || false,
    videoUrl: dbBook.video_url || '',
    pages: (dbBook.book_pages || dbBook.pages || [])
      .sort((a: any, b: any) => (a.page_number || a.pageNumber || 0) - (b.page_number || b.pageNumber || 0))
      .map((page: any) => ({
        id: page.id,
        bookId: page.book_id || page.bookId || '',
        pageNumber: page.page_number || page.pageNumber || 0,
        imageUrl: page.image_url || page.imageUrl || '',
        audioUrl: page.audio_url || page.audioUrl || page.audio || '',
        textContent: page.text_content || page.textContent || page.text || ''
      })),
    createdAt: dbBook.created_at,
    updatedAt: dbBook.updated_at
  });

  // 퀴즈 점수 증가 및 뱃지 확인 (수정됨)
  const incrementQuizScore = () => {
    console.log('🎯 Quiz score incremented:', quizScore.value + 1);
    quizScore.value++;
    quizStreak.value++;
    checkAndUnlockBadges();
  };

  const resetQuizStreak = () => {
    console.log('💔 Quiz streak reset');
    quizStreak.value = 0;
  };

  // 퍼즐 완성 증가 및 뱃지 확인 (수정됨)
  const incrementPuzzleCompletions = () => {
    console.log('🧩 Puzzle completion incremented:', puzzleCompletions.value + 1);
    puzzleCompletions.value++;
    checkAndUnlockPuzzleBadges();
  };

  // 퀴즈 뱃지 확인 및 해제 (수정됨)
  const checkAndUnlockBadges = () => {
    console.log('🔍 Checking quiz badges for score:', quizScore.value);
    
    currentBadges.value.forEach(badge => {
      if (!badge.unlocked && badge.category === 'quiz' && quizScore.value >= badge.requiredScore) {
        console.log('🏆 Unlocking quiz badge:', badge.name, 'for score:', badge.requiredScore);
        badge.unlocked = true;
      }
    });
  };

  // 퍼즐 뱃지 확인 및 해제 (수정됨)
  const checkAndUnlockPuzzleBadges = () => {
    console.log('🔍 Checking puzzle badges for completions:', puzzleCompletions.value);
    
    currentBadges.value.forEach(badge => {
      if (!badge.unlocked && badge.category === 'puzzle' && puzzleCompletions.value >= badge.requiredScore) {
        console.log('🏆 Unlocking puzzle badge:', badge.name, 'for completions:', badge.requiredScore);
        badge.unlocked = true;
      }
    });
  };

  const addBadge = (badge: Omit<Badge, 'id' | 'unlocked'>) => {
    const newBadge: Badge = {
      ...badge,
      id: Date.now().toString(),
      unlocked: false
    };
    currentBadges.value.push(newBadge);
  };

  const updateBadge = (id: string, updates: Partial<Badge>) => {
    const index = currentBadges.value.findIndex(b => b.id === id);
    if (index !== -1) {
      currentBadges.value[index] = { ...currentBadges.value[index], ...updates };
    }
  };

  const deleteBadge = (id: string) => {
    currentBadges.value = currentBadges.value.filter(b => b.id !== id);
  };

  // Admin functions
  const adminLogin = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'af383c42c29969ab9d1d0c881f9d06f8',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        adminToken.value = data.token;
        isAdminLoggedIn.value = true;
        localStorage.setItem('adminToken', data.token);
        
        // 관리자 로그인 후 데이터 로드
        await loadAllData();
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const adminLogout = async (): Promise<void> => {
    try {
      if (adminToken.value) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken.value}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      adminToken.value = '';
      isAdminLoggedIn.value = false;
      localStorage.removeItem('adminToken');
    }
  };

  const verifyAdminToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        return false;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        adminToken.value = token;
        isAdminLoggedIn.value = true;
        
        // 토큰 검증 후 데이터 로드
        await loadAllData();
        
        return true;
      } else {
        localStorage.removeItem('adminToken');
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('adminToken');
      return false;
    }
  };

  // API Key functions
  const fetchApiKeys = async (): Promise<void> => {
    try {
      if (!adminToken.value) return;

      const response = await fetch('/api/keys', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken.value}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        apiKeys.value = data.data || [];
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const createApiKey = async (name: string, description: string): Promise<ApiKey | null> => {
    try {
      if (!adminToken.value) return null;

      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchApiKeys(); // Refresh the list
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating API key:', error);
      return null;
    }
  };

  const deleteApiKey = async (id: string): Promise<boolean> => {
    try {
      if (!adminToken.value) return false;

      const response = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken.value}`,
        },
      });

      if (response.ok) {
        await fetchApiKeys(); // Refresh the list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting API key:', error);
      return false;
    }
  };

  const getImageUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    // 이미 http(s)로 시작하면 그대로 반환
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // /uploads/로 시작하면 /server 붙이기
    if (url.startsWith('/uploads/')) {
      return '/server' + url;
    }
    // /server/uploads/로 시작하면 그대로 반환
    if (url.startsWith('/server/uploads/')) {
      return url;
    }
    return url;
  };

  const loadPublicContent = async () => {
    try {
      console.log('🌐 Loading public content only...');
      await loadAllData();
      currentWords.value = currentWords.value;
      currentBooks.value = currentBooks.value;
      currentBadges.value = currentBadges.value;
      // 강제 디버깅 로그
      console.log('DEBUG words:', currentWords.value);
      console.log('DEBUG books:', currentBooks.value);
      console.log('DEBUG badges:', currentBadges.value);
      console.log('✅ Public content loaded:', {
        words: currentWords.value.length,
        books: currentBooks.value.length,
        badges: currentBadges.value.length
      });
    } catch (err: any) {
      console.error('❌ Error loading public content:', err);
    }
  };

  return {
    // State
    currentLanguage,
    currentWords,
    currentBooks,
    quizScore,
    quizStreak,
    puzzleCompletions,
    currentBadges,
    isAdminLoggedIn,
    adminToken,
    apiKeys,
    
    // Computed
    wordsByCategory,
    availableBadges,
    nextBadge,
    
    // Actions
    setLanguage,
    loadAllData,
    loadWords,
    loadBooks,
    loadBadges,
    loadPersonalizedData,
    addWord,
    updateWord,
    deleteWord,
    addBook,
    updateBook,
    deleteBook,
    incrementQuizScore,
    resetQuizStreak,
    incrementPuzzleCompletions,
    addBadge,
    updateBadge,
    deleteBadge,
    adminLogin,
    adminLogout,
    verifyAdminToken,
    fetchApiKeys,
    createApiKey,
    deleteApiKey,
    getImageUrl,
    loadPublicContent
  };
});