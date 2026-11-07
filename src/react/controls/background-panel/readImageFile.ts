import type { BackgroundImage } from '../../../map';

const DEFAULT_WIDTH = 1200;

/** Reads an image file into a data URL and gives it a size that keeps its proportions. */
export function readImageFile(file: File): Promise<BackgroundImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`The file "${file.name}" could not be read.`));
    reader.onload = () => {
      const src = String(reader.result);
      const probe = new Image();
      probe.onerror = () => reject(new Error(`The file "${file.name}" is not an image.`));
      probe.onload = () => {
        const width = DEFAULT_WIDTH;
        const height = Math.round((probe.naturalHeight / probe.naturalWidth) * width);
        resolve({ src, x: -width / 2, y: -height / 2, width, height });
      };
      probe.src = src;
    };
    reader.readAsDataURL(file);
  });
}
