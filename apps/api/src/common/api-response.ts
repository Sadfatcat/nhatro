export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export const ok = <T>(data: T, message = 'Thành công'): ApiResponse<T> => ({ success: true, data, message });
