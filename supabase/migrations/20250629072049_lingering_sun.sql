-- RLS 정책 수정 - 단어 및 책 등록 권한 문제 해결

-- 기존 단어 정책 삭제
DROP POLICY IF EXISTS "Enable read access for words" ON words;
DROP POLICY IF EXISTS "Enable insert for words" ON words;
DROP POLICY IF EXISTS "Enable update for words" ON words;
DROP POLICY IF EXISTS "Enable delete for words" ON words;

-- 기존 책 정책 삭제
DROP POLICY IF EXISTS "Enable read access for books" ON books;
DROP POLICY IF EXISTS "Enable insert for books" ON books;
DROP POLICY IF EXISTS "Enable update for books" ON books;
DROP POLICY IF EXISTS "Enable delete for books" ON books;

-- 새로운 단어 정책 (더 간단하고 명확하게)
CREATE POLICY "words_select_policy"
  ON words FOR SELECT
  TO authenticated
  USING (
    owner_type = 'global' OR 
    owner_id = auth.uid()
  );

CREATE POLICY "words_insert_policy"
  ON words FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 사용자는 자신의 단어만 추가 가능
    (owner_type = 'user' AND owner_id = auth.uid()) OR
    -- 관리자는 공용 단어 추가 가능
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "words_update_policy"
  ON words FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "words_delete_policy"
  ON words FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  );

-- 새로운 책 정책 (더 간단하고 명확하게)
CREATE POLICY "books_select_policy"
  ON books FOR SELECT
  TO authenticated
  USING (
    owner_type = 'global' OR 
    owner_id = auth.uid()
  );

CREATE POLICY "books_insert_policy"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 사용자는 자신의 책만 추가 가능
    (owner_type = 'user' AND owner_id = auth.uid()) OR
    -- 관리자는 공용 책 추가 가능
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "books_update_policy"
  ON books FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  );

CREATE POLICY "books_delete_policy"
  ON books FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (owner_type = 'global' AND auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE user_type IN ('teacher', 'director')
    ))
  );

-- 책 페이지 정책도 간소화
DROP POLICY IF EXISTS "Enable read access for book pages" ON book_pages;
DROP POLICY IF EXISTS "Enable insert for book pages" ON book_pages;
DROP POLICY IF EXISTS "Enable update for book pages" ON book_pages;
DROP POLICY IF EXISTS "Enable delete for book pages" ON book_pages;

CREATE POLICY "book_pages_select_policy"
  ON book_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (books.owner_type = 'global' OR books.owner_id = auth.uid())
    )
  );

CREATE POLICY "book_pages_insert_policy"
  ON book_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND auth.uid() IN (
          SELECT user_id FROM user_profiles 
          WHERE user_type IN ('teacher', 'director')
        ))
      )
    )
  );

CREATE POLICY "book_pages_update_policy"
  ON book_pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND auth.uid() IN (
          SELECT user_id FROM user_profiles 
          WHERE user_type IN ('teacher', 'director')
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
        (books.owner_type = 'global' AND auth.uid() IN (
          SELECT user_id FROM user_profiles 
          WHERE user_type IN ('teacher', 'director')
        ))
      )
    )
  );

CREATE POLICY "book_pages_delete_policy"
  ON book_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.owner_id = auth.uid() OR
        (books.owner_type = 'global' AND auth.uid() IN (
          SELECT user_id FROM user_profiles 
          WHERE user_type IN ('teacher', 'director')
        ))
      )
    )
  );

-- 디버깅을 위한 함수 추가 (개발 환경에서만 사용)
CREATE OR REPLACE FUNCTION debug_user_permissions()
RETURNS TABLE (
  user_id uuid,
  username text,
  user_type text,
  can_manage_global boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    up.user_id,
    up.username,
    up.user_type,
    (up.user_type IN ('teacher', 'director')) as can_manage_global
  FROM user_profiles up
  WHERE up.user_id = auth.uid();
$$;