-- 간단한 좋아요 시스템 생성

-- 1. likes 테이블 생성 (기존 favorites 테이블이 있다면 이름 변경)
DO $$
BEGIN
    -- 기존 favorites 테이블이 있으면 likes로 이름 변경
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
        ALTER TABLE favorites RENAME TO likes;
    ELSE
        -- likes 테이블이 없으면 새로 생성
        CREATE TABLE likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            content_type TEXT NOT NULL CHECK (content_type IN ('word', 'book', 'quiz', 'puzzle')),
            content_id UUID NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, content_type, content_id)
        );
    END IF;
END $$;

-- 2. 컬럼 추가 (없는 경우)
DO $$
BEGIN
    -- updated_at 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'likes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE likes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- content_type 제약 조건 업데이트
    ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_content_type_check;
    ALTER TABLE likes ADD CONSTRAINT likes_content_type_check 
        CHECK (content_type IN ('word', 'book', 'quiz', 'puzzle'));
END $$;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_likes_user_content ON likes(user_id, content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_likes_content_type ON likes(content_type);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_content_id ON likes(content_id);

-- 4. RLS 정책 설정
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can update their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- 새 정책 생성
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

-- 5. 간단한 랭킹 함수 생성
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
DECLARE
    period_filter TIMESTAMPTZ;
BEGIN
    -- 기간에 따른 필터 설정
    CASE p_period
        WHEN 'weekly' THEN
            period_filter := date_trunc('week', NOW());
        WHEN 'monthly' THEN
            period_filter := date_trunc('month', NOW());
        ELSE
            period_filter := '1970-01-01'::TIMESTAMPTZ; -- 전체 기간
    END CASE;
    
    RETURN QUERY
    SELECT 
        l.content_id,
        COUNT(*)::BIGINT as like_count,
        MAX(l.created_at) as latest_like,
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, MAX(l.created_at) DESC)::BIGINT as rank_position
    FROM likes l
    WHERE l.content_type = p_content_type
        AND l.created_at >= period_filter
    GROUP BY l.content_id
    ORDER BY like_count DESC, latest_like DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 좋아요 통계 함수
CREATE OR REPLACE FUNCTION get_likes_statistics(
    p_content_type TEXT DEFAULT NULL,
    p_period TEXT DEFAULT 'all'
) RETURNS TABLE (
    content_type TEXT,
    total_likes BIGINT,
    unique_users BIGINT,
    avg_likes_per_content NUMERIC
) AS $$
DECLARE
    period_filter TIMESTAMPTZ;
BEGIN
    -- 기간에 따른 필터 설정
    CASE p_period
        WHEN 'weekly' THEN
            period_filter := date_trunc('week', NOW());
        WHEN 'monthly' THEN
            period_filter := date_trunc('month', NOW());
        ELSE
            period_filter := '1970-01-01'::TIMESTAMPTZ; -- 전체 기간
    END CASE;
    
    RETURN QUERY
    SELECT 
        l.content_type,
        COUNT(*)::BIGINT as total_likes,
        COUNT(DISTINCT l.user_id)::BIGINT as unique_users,
        ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT l.content_id), 0), 2) as avg_likes_per_content
    FROM likes l
    WHERE (p_content_type IS NULL OR l.content_type = p_content_type)
        AND l.created_at >= period_filter
    GROUP BY l.content_type
    ORDER BY total_likes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 콘텐츠 좋아요 수 조회 함수
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 좋아요 여부 확인 함수
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 좋아요 토글 함수
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 새로 생성
DROP TRIGGER IF EXISTS update_likes_updated_at_trigger ON likes;
CREATE TRIGGER update_likes_updated_at_trigger
    BEFORE UPDATE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_likes_updated_at();

-- 11. 권한 설정
GRANT EXECUTE ON FUNCTION get_content_likes_ranking TO authenticated;
GRANT EXECUTE ON FUNCTION get_likes_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_like_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_content_liked TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;