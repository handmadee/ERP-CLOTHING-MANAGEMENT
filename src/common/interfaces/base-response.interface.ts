export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  metadata?: {
    timestamp: Date;
    path: string;
    [key: string]: any;
  };
}
