/**
 * @fileoverview Simple test to verify Jest setup works
 */

describe('TDD Setup Verification', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have global test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.validApiKey).toBe('test-api-key-12345');
  });

  it('should create test word data', () => {
    const testWord = global.testUtils.createTestWord();
    expect(testWord).toHaveProperty('name');
    expect(testWord).toHaveProperty('nameEn');
    expect(testWord).toHaveProperty('category');
  });

  it('should create test book data', () => {
    const testBook = global.testUtils.createTestBook();
    expect(testBook).toHaveProperty('title');
    expect(testBook).toHaveProperty('pages');
    expect(testBook.pages).toHaveLength(4);
  });

  it('should create test video book data', () => {
    const testVideoBook = global.testUtils.createTestVideoBook();
    expect(testVideoBook).toHaveProperty('title');
    expect(testVideoBook.isVideoMode).toBe(true);
    expect(testVideoBook).toHaveProperty('videoUrl');
  });

  it('should provide response verification utilities', () => {
    const mockResponse = {
      status: 200,
      body: {
        success: true,
        data: { test: 'data' }
      }
    };
    
    expect(() => {
      global.testUtils.expectSuccessResponse(mockResponse);
    }).not.toThrow();
  });
});