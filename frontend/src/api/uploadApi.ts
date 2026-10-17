const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface UploadApiResponse {
  success: boolean;
  data: string | null;
  message?: string;
  errors: string[];
}

export const uploadApi = {
  /**
   * Tải 1 file ảnh lên server
   */
  async uploadFile(file: File): Promise<string> {
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
    const uploadPromises = files.map((f) => this.uploadFile(f));
    return Promise.all(uploadPromises);
  },
};
