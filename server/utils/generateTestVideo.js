import fs from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Canvas를 사용하여 작은 MP4 비디오 생성 (실제로는 간단한 테스트 데이터)
export const generateTestVideo = async (title = 'Test Video', duration = 3) => {
  try {
    const uploadsDir = join(process.cwd(), 'server/uploads/videos');
    
    // uploads/videos 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `${uuidv4()}.mp4`;
    const filepath = join(uploadsDir, filename);
    
    // Base64로 인코딩된 작은 MP4 파일 (1KB 정도)
    // 실제로는 매우 짧은 검은 화면 비디오
    const base64VideoData = `
AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAt1tZGF0AAAC
rgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1OSByMjk5MSAxNzcxYjU1
IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOSAtIGh0
dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEg
cmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9
NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNo
cm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBm
YXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFk
X3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxh
Y2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0z
IGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEg
b3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5l
Y3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NjAgcmM9Y3JmIG1idHJl
ZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBp
cF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAABWWWIhAA3//727P4FNjuY0JcRzeidJHKi
UQAACAAB///+3fA=`.replace(/\n/g, '');
    
    // Base64 데이터를 Buffer로 변환하여 파일에 저장
    const buffer = Buffer.from(base64VideoData, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    return {
      filename,
      filepath,
      url: `/uploads/videos/${filename}`,
      size: buffer.length,
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