import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import type { WordItem, Book, Quiz, Badge, ApiKey, Language } from '@/types';

export const useAppStore = defineStore('app', () => {
  const { supabase } = useSupabase();
  
  // Language state
  const currentLanguage = ref<Language>('ko');
  
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
  const unlockedBadges = ref<string[]>([]);

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
    const unlockedBadges = currentBadges.value.filter(b => b.unlocked);
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
  const setLanguage = (language: Language) => {
    currentLanguage.value = language;
  };

  // 공용 콘텐츠 우선 로드 (인증 없이도 접근 가능) - 개선된 버전
  const loadWords = async () => {
    try {
      console.log('📚 Loading words from database (public access)...');
      
      // 공용 단어를 우선으로 로드 (인증 없이도 접근 가능)
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('owner_type', 'global') // 공용 단어만 로드
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading words:', error);
        // 에러가 발생해도 빈 배열로 초기화하여 앱이 동작하도록 함
        currentWords.value = [];
        return;
      }

      // 데이터베이스 형식을 프론트엔드 형식으로 변환
      currentWords.value = (data || []).map(transformWordFromDB);
      console.log('✅ Words loaded:', currentWords.value.length);
      console.log('📊 Words breakdown:', {
        global: currentWords.value.filter(w => w.ownerType === 'global').length,
        user: currentWords.value.filter(w => w.ownerType === 'user').length
      });
    } catch (error) {
      console.error('💥 Error in loadWords:', error);
      currentWords.value = [];
    }
  };

  // 공용 책 우선 로드 (인증 없이도 접근 가능)
  const loadBooks = async () => {
    try {
      console.log('📖 Loading books from database (public access)...');
      let data, error;
      // 동적으로 authStore import (Pinia store 내부에서 순환참조 방지)
      let user = null;
      let userProfile = null;
      try {
        const { useAuthStore } = await import('./auth');
        const authStore = useAuthStore();
        user = authStore.user;
        userProfile = authStore.userProfile;
      } catch (e) {
        console.warn('authStore not available:', e);
      }

      if (user && userProfile) {
        // 로그인된 경우: 관리자면 전체, 일반이면 본인+공용
        const isAdmin = userProfile.userType === 'teacher' || userProfile.userType === 'director';
        if (isAdmin) {
          ({ data, error } = await supabase
            .from('books')
            .select(`*, book_pages (*)`)
            .order('created_at', { ascending: false })
          );
        } else {
          ({ data, error } = await supabase
            .from('books')
            .select(`*, book_pages (*)`)
            .or(`owner_type.eq.global,owner_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
          );
        }
      } else {
        // 비로그인: 공용 책만
        ({ data, error } = await supabase
          .from('books')
          .select(`*, book_pages (*)`)
          .eq('owner_type', 'global')
          .order('created_at', { ascending: false })
        );
      }

      if (error) {
        console.error('❌ Error loading books:', error);
        currentBooks.value = [];
        return;
      }

      // 데이터베이스 형식을 프론트엔드 형식으로 변환
      currentBooks.value = (data || []).map(transformBookFromDB);
      console.log('✅ Books loaded:', currentBooks.value.length);
      console.log('📊 Books breakdown:', {
        global: currentBooks.value.filter(b => b.ownerType === 'global').length,
        user: currentBooks.value.filter(b => b.ownerType === 'user').length
      });
    } catch (error) {
      console.error('💥 Error in loadBooks:', error);
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
    if (!word.imageUrl || word.imageUrl === '' || !word.audioKo || word.audioKo === '' || !word.audioEn || word.audioEn === '') {
      throw new Error('이미지와 한/영 음성은 필수입니다.');
    }
    try {
      console.log('➕ Adding word to database:', word.name);
      
      // 관리자 권한 확인을 위해 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      // 사용자 프로필 확인
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error getting user profile:', profileError);
        throw new Error('사용자 프로필을 확인할 수 없습니다.');
      }

      // 관리자 권한이 있는 경우 global로, 일반 사용자는 user로 설정
      const ownerType = (profile.user_type === 'teacher' || profile.user_type === 'director') ? 'global' : 'user';
      const ownerId = ownerType === 'user' ? user.id : null;

      console.log('👤 User type:', profile.user_type, '| Owner type:', ownerType);

      const { data, error } = await supabase
        .from('words')
        .insert({
          name: word.name,
          name_en: word.nameEn,
          image_url: word.imageUrl,
          audio_ko: word.audioKo,
          audio_en: word.audioEn,
          category: word.category,
          min_age: word.minAge || 3,
          max_age: word.maxAge || 6,
          owner_type: ownerType,
          owner_id: ownerId
        })
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
    if ((updates.imageUrl !== undefined && (!updates.imageUrl || updates.imageUrl === '')) ||
        (updates.audioKo !== undefined && (!updates.audioKo || updates.audioKo === '')) ||
        (updates.audioEn !== undefined && (!updates.audioEn || updates.audioEn === ''))) {
      throw new Error('이미지와 한/영 음성은 필수입니다.');
    }
    try {
      console.log('📝 Updating word in database:', id);
      
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.nameEn) dbUpdates.name_en = updates.nameEn;
      if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
      if (updates.audioKo) dbUpdates.audio_ko = updates.audioKo;
      if (updates.audioEn) dbUpdates.audio_en = updates.audioEn;
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
      console.log('➕ Adding book to database:', book.title);
      
      // 관리자 권한 확인을 위해 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      // 사용자 프로필 확인
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error getting user profile:', profileError);
        throw new Error('사용자 프로필을 확인할 수 없습니다.');
      }

      // 관리자 권한이 있는 경우 global로, 일반 사용자는 user로 설정
      const ownerType = (profile.user_type === 'teacher' || profile.user_type === 'director') ? 'global' : 'user';
      const ownerId = ownerType === 'user' ? user.id : null;

      console.log('👤 User type:', profile.user_type, '| Owner type:', ownerType);
      
      // 먼저 책 정보 삽입
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          title: book.title,
          cover_image: book.coverImage,
          min_age: book.minAge || 3,
          max_age: book.maxAge || 6,
          owner_type: ownerType,
          owner_id: ownerId
        })
        .select()
        .single();

      if (bookError) {
        console.error('❌ Error adding book:', bookError);
        throw bookError;
      }

      // 책 페이지들 삽입
      const pagesData = book.pages.map((page, index) => {
        if (!page.imageUrl || page.imageUrl === '' || !page.audioUrl || page.audioUrl === '') {
          throw new Error(`${index + 1}장의 이미지와 음성은 필수입니다.`);
        }
        return {
          book_id: bookData.id,
          page_number: index + 1,
          image_url: page.imageUrl,
          audio_url: page.audioUrl,
          text_content: page.textContent || null
        };
      });

      const { data: pagesResult, error: pagesError } = await supabase
        .from('book_pages')
        .insert(pagesData)
        .select();

      if (pagesError) {
        console.error('❌ Error adding book pages:', pagesError);
        // 책 삭제 후 에러 던지기
        await supabase.from('books').delete().eq('id', bookData.id);
        throw pagesError;
      }

      // 로컬 상태 업데이트
      const newBook = transformBookFromDB({
        ...bookData,
        book_pages: pagesResult
      });
      currentBooks.value.unshift(newBook);
      
      console.log('✅ Book added successfully:', newBook.title);
      return newBook;
    } catch (error) {
      console.error('💥 Error in addBook:', error);
      throw error;
    }
  };

  // 책 수정
  const updateBook = async (id: string, updates: Partial<Book>) => {
    try {
      console.log('📝 Updating book in database:', id);
      
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.coverImage) dbUpdates.cover_image = updates.coverImage;
      if (updates.minAge) dbUpdates.min_age = updates.minAge;
      if (updates.maxAge) dbUpdates.max_age = updates.maxAge;
      if (updates.ownerType) dbUpdates.owner_type = updates.ownerType;
      if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;

      const { data, error } = await supabase
        .from('books')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating book:', error);
        throw error;
      }

      // 페이지 업데이트 (필요한 경우)
      if (updates.pages) {
        // 기존 페이지 삭제
        await supabase
          .from('book_pages')
          .delete()
          .eq('book_id', id);

        // 새 페이지 삽입
        const pagesData = updates.pages.map((page, index) => {
          if (!page.imageUrl || !page.audioUrl || page.imageUrl === '' || page.audioUrl === '') {
            throw new Error(`${index + 1}장의 이미지와 음성은 필수입니다.`);
          }
          return {
            book_id: id,
            page_number: index + 1,
            image_url: page.imageUrl,
            audio_url: page.audioUrl,
            text_content: page.textContent || null
          };
        });

        const { data: pagesResult, error: pagesError } = await supabase
          .from('book_pages')
          .insert(pagesData)
          .select();

        if (pagesError) {
          console.error('❌ Error updating book pages:', pagesError);
          throw pagesError;
        }

        // 로컬 상태 업데이트
        const updatedBook = transformBookFromDB({
          ...data,
          book_pages: pagesResult
        });

        const index = currentBooks.value.findIndex(b => b.id === id);
        if (index !== -1) {
          currentBooks.value[index] = updatedBook;
        }

        return updatedBook;
      } else {
        // 페이지 업데이트 없이 책 정보만 업데이트
        const index = currentBooks.value.findIndex(b => b.id === id);
        if (index !== -1) {
          currentBooks.value[index] = { ...currentBooks.value[index], ...updates };
        }
      }
      
      console.log('✅ Book updated successfully');
      return currentBooks.value.find(b => b.id === id);
    } catch (error) {
      console.error('💥 Error in updateBook:', error);
      throw error;
    }
  };

  // 책 삭제
  const deleteBook = async (id: string) => {
    try {
      console.log('🗑️ Deleting book from database:', id);
      
      // 책 페이지들이 CASCADE로 자동 삭제됨
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting book:', error);
        throw error;
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
    updatedAt: dbWord.updated_at
  });

  const transformBookFromDB = (dbBook: any): Book => ({
    id: dbBook.id,
    title: dbBook.title,
    coverImage: dbBook.cover_image,
    minAge: dbBook.min_age,
    maxAge: dbBook.max_age,
    ownerType: dbBook.owner_type,
    ownerId: dbBook.owner_id,
    pages: (dbBook.book_pages || [])
      .sort((a: any, b: any) => a.page_number - b.page_number)
      .map((page: any) => ({
        id: page.id,
        bookId: page.book_id,
        pageNumber: page.page_number,
        imageUrl: page.image_url,
        audioUrl: page.audio_url,
        textContent: page.text_content
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
        if (!unlockedBadges.value.includes(badge.id)) {
          unlockedBadges.value.push(badge.id);
        }
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
        if (!unlockedBadges.value.includes(badge.id)) {
          unlockedBadges.value.push(badge.id);
        }
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

  return {
    // State
    currentLanguage,
    currentWords,
    currentBooks,
    quizScore,
    quizStreak,
    puzzleCompletions,
    currentBadges,
    unlockedBadges,
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
    deleteApiKey
  };
});