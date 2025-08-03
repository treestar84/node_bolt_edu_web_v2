/**
 * Test setup and global configurations
 */

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Global test utilities
global.testUtils = {
  // API Key for testing
  validApiKey: 'test-api-key-12345',
  
  // Test data factories
  createTestWord: (overrides = {}) => ({
    name: '테스트 단어',
    nameEn: 'test word',
    imageUrl: '/uploads/images/test.png',
    audioKo: '/uploads/audio/test-ko.mp3',
    audioEn: '/uploads/audio/test-en.mp3',
    category: '동물',
    ...overrides
  }),
  
  createTestBook: (overrides = {}) => ({
    title: '테스트 동화책',
    coverImage: '/uploads/images/cover.png',
    isVideoMode: false,
    pages: [
      {
        imageUrl: '/uploads/images/page1.png',
        audioUrl: '/uploads/audio/page1.mp3',
        textContent: '첫 번째 페이지'
      },
      {
        imageUrl: '/uploads/images/page2.png',
        audioUrl: '/uploads/audio/page2.mp3',
        textContent: '두 번째 페이지'
      },
      {
        imageUrl: '/uploads/images/page3.png',
        audioUrl: '/uploads/audio/page3.mp3',
        textContent: '세 번째 페이지'
      },
      {
        imageUrl: '/uploads/images/page4.png',
        audioUrl: '/uploads/audio/page4.mp3',
        textContent: '네 번째 페이지'
      }
    ],
    minAge: 3,
    maxAge: 7,
    ...overrides
  }),
  
  createTestVideoBook: (overrides = {}) => ({
    title: '테스트 비디오 동화책',
    coverImage: '/uploads/images/video-cover.png',
    isVideoMode: true,
    videoUrl: '/uploads/videos/test-story.mp4',
    pages: [],
    minAge: 3,
    maxAge: 7,
    ...overrides
  }),
  
  // API test helpers
  expectSuccessResponse: (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  },
  
  expectErrorResponse: (response, statusCode, errorMessage = null) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('error');
    if (errorMessage) {
      expect(response.body.message).toContain(errorMessage);
    }
  },
  
  // Database cleanup helpers
  cleanupTestData: async () => {
    // Implementation will be added based on data store
    console.log('Cleaning up test data...');
  }
};

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});