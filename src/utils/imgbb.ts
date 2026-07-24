import { compressImageIfNeeded } from "./imageCompressor";

export interface ImgBBResult {
  success: boolean;
  url: string;
  displayUrl?: string;
  error?: string;
  wasCompressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

const DEFAULT_IMGBB_KEY = "7d62ac61cd4d1c7049cd5a8aa645a610";

/**
 * Uploads an image File or Base64 Data URL to ImgBB cloud storage.
 * Automatically compresses images > 1 MB before uploading.
 */
export async function uploadToImgBB(
  input: File | string,
  onProgress?: (stage: "compressing" | "uploading") => void
): Promise<ImgBBResult> {
  try {
    let dataUrlToSend = "";
    let wasCompressed = false;
    let originalSize = 0;
    let compressedSize = 0;

    if (input instanceof File) {
      if (onProgress) onProgress("compressing");
      const compressionResult = await compressImageIfNeeded(input, 1.0);
      dataUrlToSend = compressionResult.dataUrl;
      wasCompressed = compressionResult.wasCompressed;
      originalSize = compressionResult.originalSize;
      compressedSize = compressionResult.compressedSize;
    } else {
      dataUrlToSend = input;
    }

    if (onProgress) onProgress("uploading");

    // Try server API proxy first
    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrlToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.url) {
          return {
            success: true,
            url: data.url,
            displayUrl: data.display_url || data.url,
            wasCompressed,
            originalSize,
            compressedSize,
          };
        }
      }
    } catch (serverErr) {
      console.warn("Server API upload failed, attempting direct ImgBB upload:", serverErr);
    }

    // Direct client fallback to ImgBB API
    const base64Data = dataUrlToSend.replace(/^data:image\/\w+;base64,/, "");
    const formData = new URLSearchParams();
    formData.append("image", base64Data);

    const directResponse = await fetch(`https://api.imgbb.com/1/upload?key=${DEFAULT_IMGBB_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const directData = await directResponse.json();

    if (directData && directData.success && directData.data && directData.data.url) {
      return {
        success: true,
        url: directData.data.url,
        displayUrl: directData.data.display_url || directData.data.url,
        wasCompressed,
        originalSize,
        compressedSize,
      };
    } else {
      throw new Error(directData?.error?.message || "ImgBB upload failed");
    }
  } catch (error: any) {
    console.error("ImgBB upload error:", error);
    return {
      success: false,
      url: "",
      error: error?.message || "Failed to upload image to ImgBB",
    };
  }
}
