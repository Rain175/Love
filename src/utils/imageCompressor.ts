import imageCompression from "browser-image-compression";

export interface CompressionResult {
  dataUrl: string;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  wasCompressed: boolean;
  fileName: string;
}

/**
 * Compresses an image file if its size exceeds `maxSizeMB` (defaults to 1.0 MB).
 * Converts the resulting file to a Data URL string.
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeMB: number = 1.0,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Check if file is bigger than maxSizeMB (1 MB)
  if (originalSize <= maxSizeBytes) {
    // Under 1MB: no compression needed, read directly as data URL
    const dataUrl = await imageCompression.getDataUrlFromFile(file);
    return {
      dataUrl,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
      fileName: file.name,
    };
  }

  // File is larger than 1MB: apply compression
  const options = {
    maxSizeMB: maxSizeMB, // Max size target in MB
    maxWidthOrHeight: 1920, // Keep high quality resolution
    useWebWorker: true,
    fileType: file.type || "image/jpeg",
    onProgress,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const dataUrl = await imageCompression.getDataUrlFromFile(compressedBlob);

    return {
      dataUrl,
      originalSize,
      compressedSize: compressedBlob.size,
      wasCompressed: true,
      fileName: file.name,
    };
  } catch (error) {
    console.warn("browser-image-compression failed, falling back to original file:", error);
    const fallbackDataUrl = await imageCompression.getDataUrlFromFile(file);
    return {
      dataUrl: fallbackDataUrl,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
      fileName: file.name,
    };
  }
}

/**
 * Utility to format bytes into a readable string (e.g., "2.4 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
