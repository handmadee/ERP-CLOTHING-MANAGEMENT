export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const MESSAGES = {
  VALIDATION: {
    INVALID_EMAIL: 'Email không hợp lệ',
    INVALID_PASSWORD:
      'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
    INVALID_PHONE: 'Số điện thoại không hợp lệ',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Thông tin đăng nhập không chính xác',
    UNAUTHORIZED: 'Không có quyền truy cập',
    TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
    ACCOUNT_NOT_FOUND: 'Tài khoản không tồn tại',
    EMAIL_REGISTERED: 'Email đã được đăng ký',
    INVALID_RESET_TOKEN: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
    PASSWORD_RESET_SUCCESS: 'Đặt lại mật khẩu thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    INVALID_REFRESH_TOKEN: 'Phiên làm mới không hợp lệ',
    USER_INACTIVE: 'Tài khoản không hoạt động hoặc không tồn tại',
    USER_LOGGED_OUT: 'Người dùng đã đăng xuất. Vui lòng đăng nhập lại.',
  },
  COMMON: {
    NOT_FOUND: 'Không tìm thấy tài nguyên',
    ALREADY_EXISTS: 'Tài nguyên đã tồn tại',
    INTERNAL_ERROR: 'Lỗi hệ thống',
    SUCCESS: 'Thao tác thành công',
  },
} as const;

export const REGEX = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;
