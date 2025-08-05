// Re-export types for backward compatibility
export type { Like, LikeRankingItem, LikeStatistics, ContentType, LikePeriod } from '@/types';

// Import all decomposed composables
import { useLikesCore } from './likes/useLikesCore';
import { useLikesRanking } from './likes/useLikesRanking';
import { useLikesStatistics } from './likes/useLikesStatistics';
import { computed } from 'vue';

export function useLikes() {
  // Get all composable functions
  const coreComposable = useLikesCore();
  const rankingComposable = useLikesRanking();
  const statisticsComposable = useLikesStatistics();

  // Merge error states
  const error = computed(() => {
    return coreComposable.error.value || 
           rankingComposable.error.value || 
           statisticsComposable.error.value;
  });

  // Computed properties for filtered likes
  const myLikes = computed(() => coreComposable.likes.value);
  
  const likedWords = computed(() => 
    coreComposable.likes.value.filter(like => like.contentType === 'word')
  );
  
  const likedBooks = computed(() => 
    coreComposable.likes.value.filter(like => like.contentType === 'book')
  );

  return {
    // Core functionality
    ...coreComposable,
    
    // Ranking functionality
    ranking: rankingComposable.ranking,
    loadRanking: rankingComposable.loadRanking,
    
    // Statistics functionality
    statistics: statisticsComposable.statistics,
    loadStatistics: statisticsComposable.loadStatistics,
    getContentLikeCount: statisticsComposable.getContentLikeCount,
    
    // Filtered likes
    myLikes,
    likedWords,
    likedBooks,
    
    // Merged error state
    error
  };
}