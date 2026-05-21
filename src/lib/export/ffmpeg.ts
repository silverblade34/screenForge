import { FFmpeg } from '@ffmpeg/ffmpeg';
// @ts-ignore
import coreURL from '@ffmpeg/core?url';
// @ts-ignore
import wasmURL from '@ffmpeg/core/wasm?url';

let ffmpeg: FFmpeg | null = null;
let isLoading = false;

export const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;
  
  if (isLoading) {
    // Wait for the instance to be created if another call is currently loading it
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (ffmpeg) {
          clearInterval(check);
          resolve(ffmpeg);
        }
      }, 100);
    });
  }

  isLoading = true;
  
  try {
    const f = new FFmpeg();
    
    await f.load({
      coreURL,
      wasmURL,
    });
    
    ffmpeg = f;
    return f;
  } finally {
    isLoading = false;
  }
};
