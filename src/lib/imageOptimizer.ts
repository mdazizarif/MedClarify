/**
 * @file imageOptimizer.ts
 * @description Client-side HTML5 Canvas image compressor.
 * Resizes large camera photos to a maximum width of 1280px
 * at 0.8 JPEG quality before uploading, reducing API payload size.
 *
 * This module runs entirely in the browser — no server round-trip needed.
 */

/** Maximum dimension (width or height) for the output image in pixels */
const MAX_DIMENSION = 1280;

/** JPEG compression quality (0.0 – 1.0) */
const JPEG_QUALITY = 0.8;

/** Maximum file size in bytes (5 MB) */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Supported MIME types */
export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/**
 * Validates whether a file meets the upload requirements.
 *
 * @param file - The file to validate.
 * @returns An error message string if invalid, or null if valid.
 */
export function validateFile(file: File): string | null {
  if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
    return `Unsupported file type: ${file.type}. Please upload JPEG, PNG, WebP, or PDF.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 5 MB.`;
  }
  return null;
}

/**
 * Compresses an image file using the HTML5 Canvas API.
 * If the image is within acceptable dimensions, returns the original file as-is.
 * PDFs are not compressed and are returned as-is.
 *
 * @param file - The image File object to compress.
 * @returns A Promise resolving to a compressed Blob (JPEG) or the original File.
 *
 * @example
 * ```ts
 * const compressed = await compressImage(file);
 * const base64 = await blobToBase64(compressed);
 * ```
 */
export async function compressImage(file: File): Promise<Blob> {
  // PDFs cannot be processed by Canvas; return as-is
  if (file.type === "application/pdf") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { width, height } = img;

      // If within limits, return original
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Calculate scaled dimensions preserving aspect ratio
      const scale = MAX_DIMENSION / Math.max(width, height);
      const targetWidth = Math.round(width * scale);
      const targetHeight = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}

/**
 * Converts a Blob or File to a Base64-encoded data URL string.
 *
 * @param blob - The Blob or File to convert.
 * @returns A Promise resolving to the Base64 data URL string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:mime/type;base64, prefix to get raw Base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Computes a SHA-256 hash of an ArrayBuffer for cache keying.
 *
 * @param buffer - The raw file data to hash.
 * @returns A hex string hash.
 */
export async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
