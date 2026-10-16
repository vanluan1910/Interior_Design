const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface UploadApiResponse {
  success: boolean;
  data: string | null;
  message?: string;
  errors: string[];
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp|gif|svg)$/i)) {
    throw new Error(`Định dạng tệp "${file.name}" không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF, SVG.`);
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Ảnh "${file.name}" quá lớn (${sizeMb}MB). Dung lượng tối đa cho phép là 5MB.`);
  }
}

export const uploadApi = {
  /**
   * Tải 1 file ảnh lên server
   */
  async uploadFile(file: File): Promise<string> {
    validateImageFile(file);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Tải ảnh lên thất bại (${res.status})`);
    }

    const json: UploadApiResponse = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Tải ảnh lên thất bại.');
    }

    return json.data;
  },

  /**
   * Tải nhiều file ảnh lên server cùng lúc
   */
  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];

    // Validate each image
    files.forEach(validateImageFile);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      const res = await fetch(`${API_BASE_URL}/api/upload/multiple`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Fallback to sequential/parallel individual upload
    }

    const uploadPromises = files.map((f) => this.uploadFile(f));
    return Promise.all(uploadPromises);
  },
};
