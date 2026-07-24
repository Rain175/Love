/**
 * Compresses an image (File, Blob, or base64 string) to a compact JPEG base64 DataURL.
 * Resizes the image to fit within maxWidthHeight while preserving aspect ratio,
 * and compresses it with JPEG quality to fit under Firestore's 1MB document size limit.
 */
export function compressImage(
  source: File | Blob | string,
  maxWidthHeight = 1024,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale dimensions proportionally
      if (width > height) {
        if (width > maxWidthHeight) {
          height = Math.round((height * maxWidthHeight) / width);
          width = maxWidthHeight;
        }
      } else {
        if (height > maxWidthHeight) {
          width = Math.round((width * maxWidthHeight) / height);
          height = maxWidthHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error("Failed to load image for compression: " + String(err)));
    };

    if (typeof source === "string") {
      // If it's a base64 or URL, load directly
      img.src = source;
    } else {
      // Read File or Blob as DataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("FileReader result was empty"));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}
