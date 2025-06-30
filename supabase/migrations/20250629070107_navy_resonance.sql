/*
  # 완전한 유아 학습 앱 데이터베이스 스키마

  1. 새로운 테이블
    - `user_profiles` - 사용자 프로필 및 설정
    - `words` - 단어 콘텐츠 (공용/개인)
    - `books` - 책 콘텐츠 (공용/개인)
    - `book_pages` - 책 페이지 상세 정보
    - `user_progress` - 사용자 학습 진도
    - `badges` - 뱃지 정의
    - `user_badges` - 사용자 뱃지 획득 현황

  2. 보안
    - 모든 테이블에 RLS 활성화
    - 사용자별 데이터 접근 제한 정책 설정
    - 관리자 권한 정책 추가

  3. 기능
    - 세션 유지를 위한 적절한 정책 설정
    - 콘텐츠 소유권 및 난이도 시스템
    - 뱃지 시스템 완전 구현
*/

-- 기존 테이블이 있다면 삭제 (개발 환경에서만)
-- DROP TABLE IF EXISTS user_badges CASCADE;
-- DROP TABLE IF EXISTS badges CASCADE;
-- DROP TABLE IF EXISTS user_progress CASCADE;
-- DROP TABLE IF EXISTS book_pages CASCADE;
-- DROP TABLE IF EXISTS books CASCADE;
-- DROP TABLE IF EXISTS words CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username text UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('teacher', 'director', 'parent')),
  site_name text NOT NULL DEFAULT '유아학습',
  main_image_url text,
  child_age integer NOT NULL DEFAULT 4 CHECK (child_age BETWEEN 3 AND 6),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 단어 테이블 (공용/개인 구분)
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  image_url text NOT NULL,
  audio_ko text NOT NULL,
  audio_en text NOT NULL,
  category text NOT NULL,
  min_age integer NOT NULL DEFAULT 3 CHECK (min_age BETWEEN 3 AND 6),
  max_age integer NOT NULL DEFAULT 6 CHECK (max_age BETWEEN 3 AND 6),
  owner_type text NOT NULL DEFAULT 'global' CHECK (owner_type IN ('global', 'user')),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 책 테이블 (공용/개인 구분)
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  cover_image text NOT NULL,
  min_age integer NOT NULL DEFAULT 3 CHECK (min_age BETWEEN 3 AND 6),
  max_age integer NOT NULL DEFAULT 6 CHECK (max_age BETWEEN 3 AND 6),
  owner_type text NOT NULL DEFAULT 'global' CHECK (owner_type IN ('global', 'user')),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 책 페이지 테이블
CREATE TABLE IF NOT EXISTS book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  image_url text NOT NULL,
  audio_url text NOT NULL,
  text_content text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id, page_number)
);

-- 사용자 학습 진도 테이블
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  quiz_score integer DEFAULT 0,
  quiz_streak integer DEFAULT 0,
  puzzle_completions integer DEFAULT 0,
  words_learned integer DEFAULT 0,
  books_read integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- 뱃지 정의 테이블
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('quiz', 'puzzle', 'words', 'books')),
  required_score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 사용자 뱃지 획득 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read global and own words" ON words;
DROP POLICY IF EXISTS "Users can insert own words" ON words;
DROP POLICY IF EXISTS "Users can update own words" ON words;
DROP POLICY IF EXISTS "Users can delete own words" ON words;
DROP POLICY IF EXISTS "Users can read global and own books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;
DROP POLICY IF EXISTS "Users can read book pages for accessible books" ON book_pages;
DROP POLICY IF EXISTS "Users can manage pages for own books" ON book_pages;
DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
DROP POLICY IF EXISTS "Everyone can read badges" ON badges;
DROP POLICY IF EXISTS "Users can read own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;

-- 사용자 프로필 정책 (세션 유지 개선)
CREATE POLICY "Enable read access for own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 단어 정책 (공용 + 개인, 관리자 권한 포함)
CREATE POLICY "Enable read access for words"
  ON words FOR SELECT
  TO authenticated
  USING (
    owner_type = 'global' OR 
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    )
  );

CREATE POLICY "Enable insert for words"
  ON words FOR INSERT
  TO authenticated
  WITH CHECK (
    (owner_type = 'user' AND owner_id = auth.uid()) OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "Enable update for words"
  ON words FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "Enable delete for words"
  ON words FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  );

-- 책 정책 (공용 + 개인, 관리자 권한 포함)
CREATE POLICY "Enable read access for books"
  ON books FOR SELECT
  TO authenticated
  USING (
    owner_type = 'global' OR 
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    )
  );

CREATE POLICY "Enable insert for books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    (owner_type = 'user' AND owner_id = auth.uid()) OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "Enable update for books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "Enable delete for books"
  ON books FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    ))
  );

-- 책 페이지 정책
CREATE POLICY "Enable read access for book pages"
  ON book_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_type = 'global' OR 
        books.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND user_type IN ('teacher', 'director')
        )
      )
    )
  );

CREATE POLICY "Enable insert for book pages"
  ON book_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND user_type IN ('teacher', 'director')
        ))
      )
    )
  );

CREATE POLICY "Enable update for book pages"
  ON book_pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND user_type IN ('teacher', 'director')
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND user_type IN ('teacher', 'director')
        ))
      )
    )
  );

CREATE POLICY "Enable delete for book pages"
  ON book_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND user_type IN ('teacher', 'director')
        ))
      )
    )
  );

-- 사용자 진도 정책
CREATE POLICY "Enable all access for own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 뱃지 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Enable read access for all badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- 관리자만 뱃지 관리 가능
CREATE POLICY "Enable insert for badges (admin only)"
  ON badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    )
  );

CREATE POLICY "Enable update for badges (admin only)"
  ON badges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    )
  );

CREATE POLICY "Enable delete for badges (admin only)"
  ON badges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type IN ('teacher', 'director')
    )
  );

-- 사용자 뱃지 정책
CREATE POLICY "Enable read access for own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 기본 뱃지 데이터 삽입 (중복 방지)
INSERT INTO badges (name, icon, description, category, required_score) 
SELECT * FROM (VALUES
  ('첫 걸음', '🚗', '첫 번째 퀴즈 정답', 'quiz', 1),
  ('운전 초보', '🚌', '퀴즈 5점 달성', 'quiz', 5),
  ('운전 고수', '🚀', '퀴즈 10점 달성', 'quiz', 10),
  ('퍼즐 마스터', '🧩', '첫 번째 퍼즐 완성', 'puzzle', 1),
  ('퍼즐 달인', '🎯', '퍼즐 5개 완성', 'puzzle', 5),
  ('단어 탐험가', '📚', '10개 단어 학습', 'words', 10),
  ('책벌레', '📖', '첫 번째 책 완독', 'books', 1)
) AS v(name, icon, description, category, required_score)
WHERE NOT EXISTS (
  SELECT 1 FROM badges b 
  WHERE b.name = v.name AND b.category = v.category
);

-- 기본 공용 단어 데이터 삽입 (중복 방지)
INSERT INTO words (name, name_en, image_url, audio_ko, audio_en, category, min_age, max_age, owner_type) 
SELECT * FROM (VALUES
  ('고양이', 'Cat', 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/cat-ko.mp3', '/audio/cat-en.mp3', 'animals', 3, 6, 'global'),
  ('강아지', 'Dog', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/dog-ko.mp3', '/audio/dog-en.mp3', 'animals', 3, 6, 'global'),
  ('사과', 'Apple', 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/apple-ko.mp3', '/audio/apple-en.mp3', 'fruits', 3, 5, 'global'),
  ('바나나', 'Banana', 'https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/banana-ko.mp3', '/audio/banana-en.mp3', 'fruits', 3, 5, 'global'),
  ('자동차', 'Car', 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/car-ko.mp3', '/audio/car-en.mp3', 'vehicles', 4, 6, 'global'),
  ('버스', 'Bus', 'https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/bus-ko.mp3', '/audio/bus-en.mp3', 'vehicles', 4, 6, 'global'),
  ('집', 'House', 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/house-ko.mp3', '/audio/house-en.mp3', 'objects', 3, 6, 'global'),
  ('꽃', 'Flower', 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=300', '/audio/flower-ko.mp3', '/audio/flower-en.mp3', 'nature', 3, 5, 'global')
) AS v(name, name_en, image_url, audio_ko, audio_en, category, min_age, max_age, owner_type)
WHERE NOT EXISTS (
  SELECT 1 FROM words w 
  WHERE w.name = v.name AND w.owner_type = 'global'
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_words_owner ON words(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_words_age ON words(min_age, max_age);
CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_books_age ON books(min_age, max_age);
CREATE INDEX IF NOT EXISTS idx_book_pages_book_id ON book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);