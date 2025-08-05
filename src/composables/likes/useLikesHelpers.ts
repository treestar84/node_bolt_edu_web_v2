import type { LikePeriod, LikeStatistics } from '@/types';

// 헬퍼 함수들
export const getPeriodFilter = (period: LikePeriod): string => {
  const now = new Date();
  switch (period) {
    case 'weekly':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.toISOString();
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthStart.toISOString();
    default:
      return '1970-01-01T00:00:00.000Z'; // 전체 기간
  }
};

export const groupAndCount = (data: any[]) => {
  const grouped: Record<string, { content_id: string; count: number; created_at: string }> = {};
  
  data.forEach(item => {
    if (!grouped[item.content_id]) {
      grouped[item.content_id] = {
        content_id: item.content_id,
        count: 0,
        created_at: item.created_at
      };
    }
    grouped[item.content_id].count++;
    // 가장 최근 날짜 유지
    if (item.created_at > grouped[item.content_id].created_at) {
      grouped[item.content_id].created_at = item.created_at;
    }
  });
  
  return Object.values(grouped).sort((a, b) => b.count - a.count);
};

export const calculateStatistics = (data: any[]): LikeStatistics[] => {
  const grouped: Record<string, { totalLikes: number; uniqueUsers: Set<string>; uniqueContent: Set<string> }> = {};
  
  data.forEach(item => {
    if (!grouped[item.content_type]) {
      grouped[item.content_type] = {
        totalLikes: 0,
        uniqueUsers: new Set(),
        uniqueContent: new Set()
      };
    }
    grouped[item.content_type].totalLikes++;
    grouped[item.content_type].uniqueUsers.add(item.user_id);
    grouped[item.content_type].uniqueContent.add(item.content_id);
  });
  
  return Object.entries(grouped).map(([contentType, stats]) => ({
    contentType: contentType,
    totalLikes: stats.totalLikes,
    uniqueUsers: stats.uniqueUsers.size,
    avgLikesPerContent: stats.uniqueContent.size > 0 ? Math.round((stats.totalLikes / stats.uniqueContent.size) * 100) / 100 : 0
  }));
};