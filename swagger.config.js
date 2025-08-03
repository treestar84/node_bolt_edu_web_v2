/**
 * @fileoverview Swagger configuration for API documentation
 * @description Generates comprehensive API documentation for words and books endpoints
 */

export default {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Toddler Learning App API',
      version: '1.0.0',
      description: 'API for managing words and storybooks in the toddler learning application',
      contact: {
        name: 'API Support',
        email: 'support@toddlerlearning.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.toddlerlearning.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        Word: {
          type: 'object',
          required: ['name', 'nameEn', 'imageUrl', 'audioKo', 'audioEn', 'category'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the word',
              example: 'word-123'
            },
            name: {
              type: 'string',
              description: 'Korean name of the word',
              example: '고양이'
            },
            nameEn: {
              type: 'string',
              description: 'English name of the word',
              example: 'cat'
            },
            imageUrl: {
              type: 'string',
              description: 'URL path to the word image',
              example: '/uploads/images/cat.png'
            },
            audioKo: {
              type: 'string',
              description: 'URL path to Korean audio file',
              example: '/uploads/audio/cat-ko.mp3'
            },
            audioEn: {
              type: 'string',
              description: 'URL path to English audio file',
              example: '/uploads/audio/cat-en.mp3'
            },
            category: {
              type: 'string',
              description: 'Category of the word',
              example: '동물'
            }
          }
        },
        Book: {
          type: 'object',
          required: ['title'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the book',
              example: 'book-123'
            },
            title: {
              type: 'string',
              description: 'Title of the storybook',
              example: '아기 동물들의 하루'
            },
            coverImage: {
              type: 'string',
              description: 'URL path to the cover image',
              example: '/uploads/images/cover.png'
            },
            isVideoMode: {
              type: 'boolean',
              description: 'Whether this is a video-based book',
              example: false
            },
            videoUrl: {
              type: 'string',
              description: 'URL path to video file (for video mode books)',
              example: '/uploads/videos/story.mp4'
            },
            pages: {
              type: 'array',
              description: 'Array of book pages (for traditional books)',
              items: {
                $ref: '#/components/schemas/BookPage'
              }
            },
            minAge: {
              type: 'integer',
              description: 'Minimum recommended age',
              example: 3
            },
            maxAge: {
              type: 'integer',
              description: 'Maximum recommended age',
              example: 7
            }
          }
        },
        BookPage: {
          type: 'object',
          required: ['imageUrl', 'audioUrl'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the page',
              example: 'page-123'
            },
            imageUrl: {
              type: 'string',
              description: 'URL path to the page image',
              example: '/uploads/images/page1.png'
            },
            audioUrl: {
              type: 'string',
              description: 'URL path to the page audio',
              example: '/uploads/audio/page1.mp3'
            },
            textContent: {
              type: 'string',
              description: 'Optional text content for the page',
              example: '옛날 옛적에 작은 마을이 있었습니다.'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'Bad request'
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
              example: 'Required fields are missing'
            }
          }
        },
        BatchWordRequest: {
          type: 'object',
          required: ['words'],
          properties: {
            words: {
              type: 'array',
              description: 'Array of words to create',
              items: {
                $ref: '#/components/schemas/Word'
              }
            }
          }
        },
        BatchWordResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                created: {
                  type: 'array',
                  description: 'Successfully created words',
                  items: {
                    $ref: '#/components/schemas/Word'
                  }
                },
                errors: {
                  type: 'array',
                  description: 'Words that failed to create',
                  items: {
                    type: 'object',
                    properties: {
                      index: {
                        type: 'integer',
                        description: 'Index of the failed word in the input array'
                      },
                      error: {
                        type: 'string',
                        description: 'Error message'
                      },
                      data: {
                        type: 'object',
                        description: 'The word data that failed'
                      }
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'integer',
                      description: 'Total number of words processed'
                    },
                    created: {
                      type: 'integer',
                      description: 'Number of words successfully created'
                    },
                    failed: {
                      type: 'integer',
                      description: 'Number of words that failed'
                    }
                  }
                }
              }
            },
            message: {
              type: 'string',
              example: 'Batch operation completed: 8 created, 2 failed'
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./server/routes/*.js']
};