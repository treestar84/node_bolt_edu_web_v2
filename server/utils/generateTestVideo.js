import fs from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// 더 작고 간단한 테스트 MP4 파일 생성
export const generateTestVideo = async (title = 'Test Video', duration = 3) => {
  try {
    const uploadsDir = join(process.cwd(), 'server/uploads/videos');
    
    // uploads/videos 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `${uuidv4()}.mp4`;
    const filepath = join(uploadsDir, filename);
    
    // 더 간단하고 작은 MP4 헤더 (약 500바이트)
    const minimalMp4 = Buffer.from([
      // ftyp box
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x31,
      0x00, 0x00, 0x00, 0x00, 0x6D, 0x70, 0x34, 0x31, 0x69, 0x73, 0x6F, 0x6D,
      // mdat box (minimal)
      0x00, 0x00, 0x00, 0x08, 0x6D, 0x64, 0x61, 0x74
    ]);
    
    fs.writeFileSync(filepath, minimalMp4);
    
    return {
      filename,
      filepath,
      url: `/uploads/videos/${filename}`,
      size: minimalMp4.length,
      title
    };
  } catch (error) {
    console.error('Error generating test video:', error);
    throw new Error('Failed to generate test video');
  }
};

// 여러 개의 테스트 비디오 생성
export const generateMultipleTestVideos = async (count = 3) => {
  const videos = [];
  const titles = ['테스트 비디오 1', '테스트 비디오 2', '테스트 비디오 3', '샘플 동영상', '데모 비디오'];
  
  for (let i = 0; i < count; i++) {
    const title = titles[i] || `테스트 비디오 ${i + 1}`;
    const video = await generateTestVideo(title, 3 + i);
    videos.push(video);
  }
  
  return videos;
};