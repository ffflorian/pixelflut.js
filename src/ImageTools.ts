import * as JPEGReader from 'jpeg-js';
import {PNG} from 'pngjs';

type FileExtension = 'image/jpeg' | 'image/png';

export interface ImageContent {
  data: string[];
  height: number;
  type: string;
  width: number;
}

export function getMimeType(fileName: string): FileExtension | undefined {
  const lastPart = fileName.split('.').pop();

  if (!lastPart) {
    return undefined;
  }

  switch (lastPart.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return undefined;
  }
}

export async function parseImage(buffer: Buffer, fileName: string): Promise<ImageContent> {
  let width = 0;
  let height = 0;

  const mimeType = getMimeType(fileName);

  switch (mimeType) {
    case 'image/jpeg': {
      try {
        const rawImageData = JPEGReader.decode(buffer);
        height = rawImageData.height;
        width = rawImageData.width;
        console.info(`Decoded image as JPEG with size ${width}x${height}.`);
      } catch (error) {
        console.error('Failed to decode image as JPEG.', error);
      }
      break;
    }
    case 'image/png': {
      await new Promise((resolve, reject) => {
        const png = new PNG().parse(buffer);
        png.on('error', error => {
          console.error(error);
          reject(error);
        });
        png.on('parsed', buffer => {
          console.log([...buffer][1]);
          resolve();
        });
        png.on('metadata', console.log);
      });
      break;
    }
  }

  return {
    data: [],
    height,
    type: mimeType || '',
    width,
  };
}
