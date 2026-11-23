/**
 * Client-side Automatic Image Compressor for Nilaa RTC
 * Safely handles any photo size (even 20MB-50MB high-res phone photos)
 * by downscaling and compressing in-memory before cropping and uploading.
 */

export async function compressRawImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to decode image"));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(reader.result as string);
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG dataURL for the in-memory crop modal preview
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates a circular-cropped, ultra-optimized WebP avatar blob (size 192x192, ~8KB to 15KB).
 */
export async function cropAvatarToBlob(
  imageSrc: string,
  cropZoom = 1,
  size = 192,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onerror = () => reject(new Error("Failed to load cropped source"));

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to initialize canvas context"));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const minDim = Math.min(img.width, img.height);
      const drawSize = minDim * cropZoom;
      const sx = (img.width - drawSize) / 2;
      const sy = (img.height - drawSize) / 2;

      ctx.drawImage(img, sx, sy, drawSize, drawSize, 0, 0, size, size);

      // Export as WebP blob (falls back gracefully to standard image in browser)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate avatar blob"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.src = imageSrc;
  });
}
