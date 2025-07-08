import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useAuthStore } from './auth';
import { useAppStore } from './app';
import type { WordItem, Book, Badge, UserBadge } from '@/types';

export const useContentStore = defineStore('content', () => {
  const { supabase, getBadges, getUserBadges, unlockBadge } = useSupabase();
  const authStore = useAuthStore();
  const appStore = useAppStore();
  
  const words = ref<WordItem[]>([]);
  const books = ref<Book[]>([]);
  const badges = ref<Badge[]>([]);
  const userBadges = ref<UserBadge[]>([]);
  const isLoading = ref(false);
  const error = ref<string>('');

  // Computed properties
  const wordsByCategory = computed(() => {
    const grouped: Record<string, WordItem[]> = {};
    words.value.forEach(word => {
      if (!grouped[word.category]) {
        grouped[word.category] = [];
      }
      grouped[word.category].push(word);
    });
    return grouped;
  });

  // FIXED: 올바른 뱃지 표시 로직
  const availableBadges = computed(() => {
    console.log('🏆 Computing available badges...');
    console.log('📊 User badges raw data:', userBadges.value);
    
    const result = userBadges.value
      .map(ub => {
        console.log('🎖️ Processing user badge:', ub);
        // FIXED: 올바른 데이터 구조 접근
        const badge = ub.badges || ub.badge;
        if (badge) {
          console.log('✅ Found badge:', badge.name);
          return badge;
        } else {
          console.log('❌ No badge data found in:', ub);
          return null;
        }
      })
      .filter((badge): badge is Badge => badge !== null);
    
    console.log('✅ Available badges computed:', result.length, result.map(b => b.name));
    return result;
  });

  const nextBadge = computed(() => {
    if (!authStore.userProgress) return null;
    
    const unlockedBadgeIds = userBadges.value.map(ub => ub.badgeId);
    const lockedBadges = badges.value.filter(b => !unlockedBadgeIds.includes(b.id));
    
    if (lockedBadges.length === 0) return null;
    
    return lockedBadges.reduce((next, badge) => {
      if (!next || badge.requiredScore < next.requiredScore) {
        return badge;
      }
      return next;
    });
  });

  // Load all content for current user (개인화된 콘텐츠 + 공용 콘텐츠)
  const loadContent = async () => {
    if (!authStore.user || !authStore.userProfile) {
      console.log('⚠️ No authenticated user, loading public content only');
      await loadPublicContent();
      return;
    }

    try {
      isLoading.value = true;
      error.value = '';

      console.log('🔄 Loading personalized content for user:', authStore.user.id, 'age:', authStore.childAge);

      // 개인화된 데이터 로드 (공용 + 개인)
      await appStore.loadPersonalizedData(authStore.user.id, authStore.childAge);
      
      // App store에서 로드된 데이터 가져오기
      words.value = appStore.currentWords;
      books.value = appStore.currentBooks;

      // 뱃지 및 사용자 뱃지 로드 - FIXED: 강화된 로딩 로직
      console.log('🏆 Loading badges and user badges...');
      const [badgesData, userBadgesData] = await Promise.all([
        getBadges(),
        getUserBadges(authStore.user.id)
      ]);

      console.log('📊 Raw badges data:', badgesData?.length || 0, 'badges');
      console.log('📊 Raw user badges data:', userBadgesData?.length || 0, 'user badges');
      console.log('🔍 User badges structure:', userBadgesData);

      badges.value = badgesData || [];
      userBadges.value = userBadgesData || [];

      // FIXED: 즉시 computed 재계산 트리거
      console.log('🔄 Triggering badge computation...');
      const availableBadgesCount = availableBadges.value.length;
      
      console.log('✅ Personalized content loaded:', {
        words: words.value.length,
        books: books.value.length,
        badges: badges.value.length,
        userBadges: userBadges.value.length,
        availableBadges: availableBadgesCount
      });

    } catch (err: any) {
      console.error('❌ Error loading personalized content:', err);
      error.value = err.message;
      
      // 에러 발생 시 공용 콘텐츠라도 로드
      console.log('🔄 Falling back to public content due to error');
      await loadPublicContent();
    } finally {
      isLoading.value = false;
    }
  };

  // 공용 콘텐츠만 로드 (인증되지 않은 사용자용)
  const loadPublicContent = async () => {
    try {
      console.log('🌐 Loading public content only...');
      await appStore.loadAllData();
      words.value = appStore.currentWords;
      books.value = appStore.currentBooks;
      badges.value = appStore.currentBadges;
      
      console.log('✅ Public content loaded:', {
        words: words.value.length,
        books: books.value.length,
        badges: badges.value.length
      });
    } catch (err: any) {
      console.error('❌ Error loading public content:', err);
      error.value = err.message;
    }
  };

  // Add new word
  const addWord = async (wordData: Omit<WordItem, 'id' | 'ownerType' | 'ownerId'>) => {
    if (!authStore.user) return null;

    try {
      const { data, error: addError } = await supabase
        .from('words')
        .insert({
          name: wordData.name,
          name_en: wordData.nameEn,
          image_url: wordData.imageUrl,
          audio_ko: wordData.audioKo,
          audio_en: wordData.audioEn,
          category: wordData.category,
          min_age: wordData.minAge,
          max_age: wordData.maxAge,
          owner_type: 'user',
          owner_id: authStore.user.id
        })
        .select()
        .single();

      if (addError) throw addError;

      const newWord = transformWordFromDB(data);
      words.value.unshift(newWord);
      
      return newWord;
    } catch (err: any) {
      console.error('Error adding word:', err);
      error.value = err.message;
      return null;
    }
  };

  // Add new book
  const addBook = async (bookData: Omit<Book, 'id' | 'ownerType' | 'ownerId'>) => {
    if (!authStore.user) return null;

    try {
      // Insert book
      const { data: bookResult, error: bookError } = await supabase
        .from('books')
        .insert({
          title: bookData.title,
          cover_image: bookData.coverImage,
          min_age: bookData.minAge,
          max_age: bookData.maxAge,
          owner_type: 'user',
          owner_id: authStore.user.id
        })
        .select()
        .single();

      if (bookError) throw bookError;

      // Insert pages
      const pagesData = bookData.pages.map((page, index) => ({
        book_id: bookResult.id,
        page_number: index + 1,
        image_url: page.imageUrl,
        audio_url: page.audioUrl,
        text_content: page.textContent
      }));

      const { data: pagesResult, error: pagesError } = await supabase
        .from('book_pages')
        .insert(pagesData)
        .select();

      if (pagesError) throw pagesError;

      const newBook = transformBookFromDB({
        ...bookResult,
        book_pages: pagesResult
      });

      books.value.unshift(newBook);
      return newBook;
    } catch (err: any) {
      console.error('Error adding book:', err);
      error.value = err.message;
      return null;
    }
  };

  // FIXED: 완전히 새로운 뱃지 확인 로직
  const checkBadgeUnlocks = async () => {
    if (!authStore.user || !authStore.userProgress) {
      console.log('⚠️ No user or progress data for badge check');
      return [];
    }

    const progress = authStore.userProgress;
    const unlockedBadgeIds = userBadges.value.map(ub => ub.badge_id);
    const newlyUnlocked: Badge[] = [];

    console.log('🔍 Starting badge unlock check...');
    console.log('📊 Current progress:', {
      quiz_score: progress.quiz_score,
      puzzle_completions: progress.puzzle_completions,
      words_learned: progress.words_learned,
      books_read: progress.books_read
    });
    console.log('🎖️ Already unlocked badge IDs:', unlockedBadgeIds);
    console.log('🏆 Total badges available:', badges.value.length);

    for (const badge of badges.value) {
      if (unlockedBadgeIds.includes(badge.id)) {
        console.log(`⏭️ Badge "${badge.name}" already unlocked, skipping`);
        continue;
      }

      let shouldUnlock = false;
      let currentValue = 0;

      switch (badge.category) {
        case 'quiz':
          currentValue = progress.quiz_score;
          shouldUnlock = currentValue >= badge.required_score;
          break;
        case 'puzzle':
          currentValue = progress.puzzle_completions;
          shouldUnlock = currentValue >= badge.required_score;
          break;
        case 'words':
          currentValue = progress.words_learned;
          shouldUnlock = currentValue >= badge.required_score;
          break;
        case 'books':
          currentValue = progress.books_read;
          shouldUnlock = currentValue >= badge.required_score;
          break;
      }

      console.log(`🎯 Badge "${badge.name}" (${badge.category}): ${currentValue}/${badge.required_score} - ${shouldUnlock ? '🔓 UNLOCK!' : '🔒 Not yet'}`);

      if (shouldUnlock) {
        try {
          console.log('🏆 Attempting to unlock badge:', badge.name);
          const result = await unlockBadge(authStore.user.id, badge.id);
          
          if (result) {
            console.log('✅ Badge unlock successful, adding to userBadges');
            userBadges.value.push(result);
            newlyUnlocked.push(badge);
            
            // FIXED: 즉시 UI 업데이트를 위한 강제 재계산
            console.log('🔄 Forcing UI update...');
            
          } else {
            console.log('❌ Badge unlock returned null/undefined');
          }
        } catch (err) {
          console.error('❌ Error unlocking badge:', err);
        }
      }
    }

    console.log('🎉 Badge unlock check complete!');
    console.log('🆕 Newly unlocked badges:', newlyUnlocked.map(b => b.name));
    console.log('📊 Total user badges now:', userBadges.value.length);
    console.log('🏆 Available badges now:', availableBadges.value.length);

    return newlyUnlocked;
  };

  // FIXED: 강제 뱃지 새로고침 함수
  const forceRefreshBadges = async () => {
    if (!authStore.user) return;
    
    console.log('🔄 Force refreshing badges...');
    try {
      const userBadgesData = await getUserBadges(authStore.user.id);
      userBadges.value = userBadgesData || [];
      console.log('✅ Badges force refreshed:', userBadges.value.length);
    } catch (err) {
      console.error('❌ Error force refreshing badges:', err);
    }
  };

  // Transform database objects to frontend types
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

  return {
    // State
    words,
    books,
    badges,
    userBadges,
    isLoading,
    error,
    
    // Computed
    wordsByCategory,
    availableBadges,
    nextBadge,
    
    // Actions
    loadContent,
    loadPublicContent,
    addWord,
    addBook,
    checkBadgeUnlocks,
    forceRefreshBadges
  };
});