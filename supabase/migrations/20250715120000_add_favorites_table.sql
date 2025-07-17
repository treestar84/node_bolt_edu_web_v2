/*
  # 즐겨찾기 기능 추가

  1. favorites 테이블 생성
    - 사용자별 즐겨찾기 관리
    - 단어와 책 모두 지원
    - 중복 방지를 위한 UNIQUE 제약조건

  2. RLS 정책 설정
    - 사용자는 자신의 즐겨찾기만 관리 가능
*/

-- 즐겨찾기 테이블 생성
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('word', 'book')),
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- RLS 활성화
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 즐겨찾기만 읽기 가능
CREATE POLICY "Users can read own favorites"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 사용자는 자신의 즐겨찾기만 추가 가능
CREATE POLICY "Users can insert own favorites"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 사용자는 자신의 즐겨찾기만 삭제 가능
CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_content_type ON favorites(content_type);
CREATE INDEX IF NOT EXISTS idx_favorites_user_content ON favorites(user_id, content_type);