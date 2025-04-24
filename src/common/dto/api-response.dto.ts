export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, path?: string): ApiResponse<T> {
    return new ApiResponse<T>({
      success: true,
      data,
      path,
    });
  }

  static error<T>(
    code: string,
    message: string,
    details?: any,
    path?: string,
  ): ApiResponse<T> {
    return new ApiResponse<T>({
      success: false,
      error: {
        code,
        message,
        details,
      },
      path,
    });
  }
}
