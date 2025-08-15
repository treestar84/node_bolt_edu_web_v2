export interface WordItem {
  id: string;
  name: string;
  nameEn: string;
  imageUrl: string | null;
  audioKo: string;
  audioEn: string;
  category: string;
  minAge: number;
  maxAge: number;
  ownerType: 'global' | 'user';
  ownerId?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAspectRatio?: number;
  createdAt?: string;
  updatedAt?: string;
  translations?: string; // JSON 문자열로 저장된 다국어 번역
  autoTranslated?: boolean; // 자동 번역 여부
}

export interface BookPage {
  id: string;
  bookId: string;
  pageNumber: number;
  imageUrl: string;
  audioUrl: string;
  textContent?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAspectRatio?: number;
}

export interface Book {
  id: string;
  title: string;
  coverImage: string;
  minAge: number;
  maxAge: number;
  ownerType: 'global' | 'user';
  ownerId?: string;
  pages: BookPage[];
  videoUrl?: string; // 영상 모드용
  isVideoMode?: boolean; // 영상 모드 여부
  coverImageWidth?: number;
  coverImageHeight?: number;
  coverImageAspectRatio?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  userType: 'teacher' | 'director' | 'parent';
  siteName: string;
  mainImageUrl?: string;
  childName?: string;
  childBirthDate?: string;
  childAgeMonths?: number;
  childAge?: number; // 호환성을 위해 유지
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  quizScore: number;
  quizStreak: number;
  puzzleCompletions: number;
  wordsLearned: number;
  booksRead: number;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'quiz' | 'puzzle' | 'words' | 'books';
  requiredScore: number;
  createdAt?: string;
  unlocked?: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  unlockedAt: string;
}

export interface Quiz {
  id: string;
  audioUrl: string;
  correctAnswerId: string;
  options: WordItem[];
  language: 'ko' | 'en';
}

export interface ApiKey {
  id: string;
  name: string;
  description: string;
  key: string;
  active: boolean;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  keyPreview?: string;
}

export interface Like {
  id: string;
  userId: string;
  contentType: 'word' | 'book' | 'quiz' | 'puzzle';
  contentId: string;
  content_title?: string; // Add this line
  content_name?: string; // Add this line
  createdAt: string;
  updatedAt: string;
}

export interface LikeRankingItem {
  contentId: string;
  likeCount: number;
  latestLike: string;
  rankPosition: number;
}

export interface LikeStatistics {
  contentType: string;
  totalLikes: number;
  uniqueUsers: number;
  avgLikesPerContent: number;
}

// 퀴즈 결과 인터페이스
export interface QuizResult {
  id: string;
  userId: string;
  quizType: 'word_quiz' | 'book_quiz' | 'general_quiz';
  questionId?: string;
  questionText?: string;
  correctAnswer?: string;
  userAnswer?: string;
  isCorrect: boolean;
  responseTimeMs?: number;
  difficultyLevel?: number;
  createdAt: string;
  updatedAt: string;
}

// 사용자 학습 통계 인터페이스
export interface UserLearningStats {
  id: string;
  userId: string;
  childAgeMonths: number;
  totalQuizAttempts: number;
  correctAnswers: number;
  currentAccuracyRate: number;
  totalWordsLearned: number;
  totalBooksRead: number;
  totalPuzzlesCompleted: number;
  learningStreakDays: number;
  lastActivityDate: string;
  createdAt: string;
  updatedAt: string;
}

// 연령대별 그룹 비교 인터페이스
export interface AgeGroupComparison {
  userInfo: {
    childName: string;
    childAgeMonths: number;
    accuracyRate: number;
    totalQuizAttempts: number;
    wordsLearned: number;
    booksRead: number;
  };
  percentile: number;
  ageGroup: {
    name: string;
    userCount: number;
    avgAccuracyRate: number;
    medianAccuracy: number;
    accuracy25th: number;
    accuracy75th: number;
  };
}

// 색칠 작품 인터페이스
export interface ColoringArtwork {
  id: string;
  userId: string;
  wordId: string;
  wordName: string;
  artworkData: string; // Base64 이미지 데이터
  completionPercentage: number;
  colorsUsed: string[]; // 사용된 색상 배열
  brushStrokes: number;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
}

// 색칠 갤러리 응답 인터페이스
export interface ColoringGalleryResponse {
  artworks: ColoringArtwork[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

// 색칠 통계 인터페이스
export interface ColoringStats {
  totalArtworks: number;
  avgCompletionRate: number;
  totalTimeSpent: number;
  uniqueWordsColored: number;
  lastArtworkDate: string;
  favoriteColor: string;
}

// 관리자 UI용 Word 인터페이스 (테이블 및 모달에서 사용)
export interface WordTableItem {
  id: string;
  name: string;
  nameEn: string;
  imageUrl: string;
  audioUrl: string;
  category: string;
  ageGroup: number;
  ownerType?: 'admin' | 'teacher';
}

// Word 폼 데이터 인터페이스 (관리자 폼용 - 완전한 데이터)
export interface WordFormData {
  name: string;
  nameEn: string;
  imageUrl: string;
  audioKo: string;
  audioEn: string;
  category: string;
  minAge: number;
  maxAge: number;
  ownerType: 'global' | 'user';
  ownerId?: string;
}

// Word 모달 폼 데이터 인터페이스 (UI 전용)
export interface WordModalFormData {
  name: string;
  nameEn: string;
  imageUrl: string;
  audioUrl: string;
  category: string;
  ageGroup: number;
  ownerType: 'admin' | 'teacher';
}

// Book 모달 폼 데이터 인터페이스 (UI 전용)
export interface BookModalFormData {
  title: string;
  minAge: number;
  maxAge: number;
  ownerType: 'global' | 'user';
  isVideoMode: boolean;
}

// 퍼즐 조각 인터페이스
export interface PuzzlePiece {
  id: string;
  image: string;
  correctPosition: number;
  placed: boolean;
}

export type Language = 'ko' | 'en';
export type GameMode = 'words' | 'quiz' | 'books' | 'puzzle' | 'coloring';
export type UserType = 'teacher' | 'director' | 'parent';
export type ContentType = 'word' | 'book' | 'quiz' | 'puzzle' | 'coloring';
export type LikePeriod = 'all' | 'monthly' | 'weekly';