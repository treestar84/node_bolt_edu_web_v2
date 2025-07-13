-- Add image dimensions to words and book_pages tables
-- This will help with puzzle layout calculations

-- Add image dimensions to words table
ALTER TABLE words 
ADD COLUMN image_width INTEGER,
ADD COLUMN image_height INTEGER,
ADD COLUMN image_aspect_ratio DECIMAL(10,6);

-- Add image dimensions to book_pages table  
ALTER TABLE book_pages
ADD COLUMN image_width INTEGER,
ADD COLUMN image_height INTEGER,
ADD COLUMN image_aspect_ratio DECIMAL(10,6);

-- Add image dimensions to books cover image
ALTER TABLE books
ADD COLUMN cover_image_width INTEGER,
ADD COLUMN cover_image_height INTEGER,
ADD COLUMN cover_image_aspect_ratio DECIMAL(10,6);

-- Add comment for clarity
COMMENT ON COLUMN words.image_width IS 'Width of the image in pixels';
COMMENT ON COLUMN words.image_height IS 'Height of the image in pixels';  
COMMENT ON COLUMN words.image_aspect_ratio IS 'Aspect ratio (width/height) for puzzle layout';

COMMENT ON COLUMN book_pages.image_width IS 'Width of the page image in pixels';
COMMENT ON COLUMN book_pages.image_height IS 'Height of the page image in pixels';
COMMENT ON COLUMN book_pages.image_aspect_ratio IS 'Aspect ratio (width/height) for layout';

COMMENT ON COLUMN books.cover_image_width IS 'Width of the cover image in pixels';
COMMENT ON COLUMN books.cover_image_height IS 'Height of the cover image in pixels';
COMMENT ON COLUMN books.cover_image_aspect_ratio IS 'Aspect ratio (width/height) for layout';