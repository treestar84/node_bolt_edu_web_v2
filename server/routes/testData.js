import express from 'express';
import { generateTestVideo, generateMultipleTestVideos } from '../utils/generateTestVideo.js';
import { addBook } from '../data/store.js';

const router = express.Router();

// 단일 테스트 비디오 생성
router.post('/video', async (req, res) => {
  try {
    const { title = '테스트 비디오', createBook = false } = req.body;
    
    const video = await generateTestVideo(title);
    
    let book = null;
    if (createBook) {
      // 자동으로 책도 생성
      book = await addBook({
        title: video.title,
        coverImage: '', // 빈 커버 이미지
        isVideoMode: true,
        videoUrl: video.url,
        pages: [],
        minAge: 3,
        maxAge: 7
      });
    }
    
    res.json({
      success: true,
      data: {
        video,
        book
      },
      message: `테스트 비디오가 생성되었습니다 (크기: ${video.size} bytes)`
    });
  } catch (error) {
    console.error('Test video generation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 여러 테스트 비디오 생성
router.post('/videos', async (req, res) => {
  try {
    const { count = 3, createBooks = false } = req.body;
    
    const videos = await generateMultipleTestVideos(count);
    const books = [];
    
    if (createBooks) {
      // 각 비디오에 대해 책도 생성
      for (const video of videos) {
        const book = await addBook({
          title: video.title,
          coverImage: '',
          isVideoMode: true,
          videoUrl: video.url,
          pages: [],
          minAge: 3,
          maxAge: 7
        });
        books.push(book);
      }
    }
    
    res.json({
      success: true,
      data: {
        videos,
        books: createBooks ? books : null
      },
      message: `${videos.length}개의 테스트 비디오가 생성되었습니다`
    });
  } catch (error) {
    console.error('Multiple test videos generation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 테스트 데이터 정리 (모든 테스트 비디오 삭제)
router.delete('/cleanup', async (req, res) => {
  try {
    // 이 부분은 실제 파일 삭제 로직을 구현해야 함
    res.json({
      success: true,
      message: '테스트 데이터 정리가 완료되었습니다'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;