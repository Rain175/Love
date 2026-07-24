/**
 * Utility to compress image files in the browser if they exceed a specified size.
 * Uses HTML5 Canvas to resize and compress images safely under 1MB (the Firestore document limit).
 */
export async function compressImageIfNeeded(file: File, maxSizeBytes = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    // If the file is already small enough, convert it to base64 directly to preserve original quality.
    if (file.size <= maxSizeBytes) {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise, read and compress the image using canvas.
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // If the image is extremely large, resize it to a reasonable maximum dimension (e.g. 1200px)
        // to prevent canvas memory limits and ensure quick load/upload.
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context from canvas"));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively reduce JPEG quality if needed to ensure base64 string length fits within limits.
        // Base64 encoding is approximately 4/3 of the binary size.
        const maxBase64Length = Math.floor((maxSizeBytes * 4) / 3);
        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        while (dataUrl.length > maxBase64Length && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image element"));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
