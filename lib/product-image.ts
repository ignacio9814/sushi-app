import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen"));
    image.src = src;
  });
}

export async function compressImageFile(file: File, maxSize = 900) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen");
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("No se pudo comprimir"))),
        "image/jpeg",
        0.78
      );
    });
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo guardar la imagen"));
    reader.readAsDataURL(blob);
  });
}

export async function saveProductPhoto(productId: string, file: File) {
  const blob = await compressImageFile(file);
  if (storage) {
    const storageRef = ref(storage, `productos/${productId}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return getDownloadURL(storageRef);
  }
  return blobToDataUrl(blob);
}
