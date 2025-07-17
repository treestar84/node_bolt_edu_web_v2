-- 기존 favorites 테이블을 likes로 변경하고 랭킹 시스템 추가

-- 1. favorites 테이블을 likes로 이름 변경
ALTER TABLE IF EXISTS favorites RENAME TO likes;

-- 2. likes 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('word', 'book', 'quiz', 'puzzle')),
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- 3. 좋아요 집계를 위한 뷰 생성 (전체 기간)
CREATE OR REPLACE VIEW likes_ranking_all AS
SELECT 
  content_type,
  content_id,
  COUNT(*) as like_count,
  MAX(created_at) as latest_like
FROM likes
GROUP BY content_type, content_id
ORDER BY like_count DESC, latest_like DESC;

-- 4. 월간 좋아요 랭킹 뷰
CREATE OR REPLACE VIEW likes_ranking_monthly AS
SELECT 
  content_type,
  content_id,
  COUNT(*) as like_count,
  MAX(created_at) as latest_like
FROM likes
WHERE created_at >= date_trunc('month', NOW())
GROUP BY content_type, content_id
ORDER BY like_count DESC, latest_like DESC;

-- 5. 주간 좋아요 랭킹 뷰
CREATE OR REPLACE VIEW likes_ranking_weekly AS
SELECT 
  content_type,
  content_id,
  COUNT(*) as like_count,
  MAX(created_at) as latest_like
FROM likes
WHERE created_at >= date_trunc('week', NOW())
GROUP BY content_type, content_id
ORDER BY like_count DESC, latest_like DESC;

-- 6. 콘텐츠 타입별 랭킹 함수 생성
CREATE OR REPLACE FUNCTION get_content_likes_ranking(
  p_content_type TEXT,
  p_period TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  content_id UUID,
  like_count BIGINT,
  latest_like TIMESTAMPTZ,
  rank_position BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.content_id,
    r.like_count,
    r.latest_like,
    ROW_NUMBER() OVER (ORDER BY r.like_count DESC, r.latest_like DESC) as rank_position
  FROM (
    CASE 
      WHEN p_period = 'monthly' THEN
        (SELECT * FROM likes_ranking_monthly WHERE content_type = p_content_type)
      WHEN p_period = 'weekly' THEN
        (SELECT * FROM likes_ranking_weekly WHERE content_type = p_content_type)
      ELSE
        (SELECT * FROM likes_ranking_all WHERE content_type = p_content_type)
    END
  ) as r
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS 정책 설정
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 좋아요만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own likes"
  ON likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own likes"
  ON likes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- 8. 좋아요 수 실시간 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 생성
DROP TRIGGER IF EXISTS update_likes_updated_at_trigger ON likes;
CREATE TRIGGER update_likes_updated_at_trigger
  BEFORE UPDATE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_likes_updated_at();

-- 10. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_likes_content_type_count 
ON likes(content_type, created_at);

CREATE INDEX IF NOT EXISTS idx_likes_user_content 
ON likes(user_id, content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_likes_created_at 
ON likes(created_at);

-- 11. 좋아요 통계 함수 생성
CREATE OR REPLACE FUNCTION get_likes_statistics(
  p_content_type TEXT DEFAULT NULL,
  p_period TEXT DEFAULT 'all'
) RETURNS TABLE (
  content_type TEXT,
  total_likes BIGINT,
  unique_users BIGINT,
  avg_likes_per_content NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.content_type,
    COUNT(*) as total_likes,
    COUNT(DISTINCT l.user_id) as unique_users,
    ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT l.content_id), 2) as avg_likes_per_content
  FROM likes l
  WHERE 
    (p_content_type IS NULL OR l.content_type = p_content_type)
    AND (
      CASE 
        WHEN p_period = 'monthly' THEN l.created_at >= date_trunc('month', NOW())
        WHEN p_period = 'weekly' THEN l.created_at >= date_trunc('week', NOW())
        ELSE TRUE
      END
    )
  GROUP BY l.content_type
  ORDER BY total_likes DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. 콘텐츠 좋아요 수 조회 함수
CREATE OR REPLACE FUNCTION get_content_like_count(
  p_content_type TEXT,
  p_content_id UUID
) RETURNS INTEGER AS $$
DECLARE
  like_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO like_count
  FROM likes
  WHERE content_type = p_content_type AND content_id = p_content_id;
  
  RETURN COALESCE(like_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 13. 사용자 좋아요 여부 확인 함수
CREATE OR REPLACE FUNCTION is_content_liked(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  is_liked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE user_id = p_user_id 
      AND content_type = p_content_type 
      AND content_id = p_content_id
  ) INTO is_liked;
  
  RETURN COALESCE(is_liked, FALSE);
END;
$$ LANGUAGE plpgsql;

-- 14. 좋아요 토글 함수
CREATE OR REPLACE FUNCTION toggle_like(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  is_liked BOOLEAN;
BEGIN
  -- 현재 좋아요 상태 확인
  SELECT is_content_liked(p_user_id, p_content_type, p_content_id) INTO is_liked;
  
  IF is_liked THEN
    -- 좋아요 취소
    DELETE FROM likes
    WHERE user_id = p_user_id 
      AND content_type = p_content_type 
      AND content_id = p_content_id;
    RETURN FALSE;
  ELSE
    -- 좋아요 추가
    INSERT INTO likes (user_id, content_type, content_id)
    VALUES (p_user_id, p_content_type, p_content_id)
    ON CONFLICT (user_id, content_type, content_id) DO NOTHING;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 15. 권한 설정
GRANT SELECT ON likes_ranking_all TO authenticated;
GRANT SELECT ON likes_ranking_monthly TO authenticated;
GRANT SELECT ON likes_ranking_weekly TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_likes_ranking TO authenticated;
GRANT EXECUTE ON FUNCTION get_likes_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_like_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_content_liked TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;