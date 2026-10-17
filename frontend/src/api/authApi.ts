export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email?: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface AuthApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN_KEY = 'd2_luxury_auth_token';
const USER_KEY = 'd2_luxury_auth_user_v1';

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },
  getUser<T = any>(): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser<T = any>(user: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  removeUser() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },
  clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const authApi = {
  /**
   * Đăng nhập tài khoản
   */
  async login(payload: LoginPayload): Promise<AuthResult> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
      }),
    });

    const json: AuthApiResponse<AuthResult> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Đăng nhập thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success || !json.data) {
      const errorMsg = json.message || json.errors?.[0] || 'Email hoặc mật khẩu không chính xác.';
      throw new Error(errorMsg);
    }

    // Persist token & user
    if (json.data.token) {
      authStorage.setToken(json.data.token);
    }

    return json.data;
  },

  /**
   * Đăng ký tài khoản gia chủ mới
   */
  async register(payload: RegisterPayload): Promise<AuthResult> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.email?.trim() || '',
        password: payload.password,
        phoneNumber: payload.phoneNumber?.trim() || '',
      }),
    });

    const json: AuthApiResponse<AuthResult> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Đăng ký thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success || !json.data) {
      const errorMsg = json.message || json.errors?.[0] || 'Đăng ký tài khoản thất bại.';
      throw new Error(errorMsg);
    }

    return json.data;
  },

  /**
   * Đăng nhập bằng Google Credential (JWT)
   */
  async googleLogin(credential: string): Promise<AuthResult> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ credential }),
    });

    const json: AuthApiResponse<AuthResult> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Đăng nhập Google thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success || !json.data) {
      const errorMsg = json.message || json.errors?.[0] || 'Đăng nhập Google thất bại.';
      throw new Error(errorMsg);
    }

    if (json.data.token) {
      authStorage.setToken(json.data.token);
    }

    return json.data;
  },

  /**
   * Yêu cầu gửi mã OTP đặt lại mật khẩu
   */
  async forgotPassword(identifier: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ identifier: identifier.trim() }),
    });

    const json: AuthApiResponse<string> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Yêu cầu gửi OTP thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success) {
      const errorMsg = json.message || json.errors?.[0] || 'Không tìm thấy tài khoản với thông tin này.';
      throw new Error(errorMsg);
    }

    return json.message || 'Mã xác thực OTP đã được gửi về hòm thư của quý khách.';
  },

  /**
   * Xác thực OTP và đặt lại mật khẩu mới
   */
  async resetPasswordWithOtp(payload: {
    identifier: string;
    otp: string;
    newPassword: string;
  }): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        identifier: payload.identifier.trim(),
        otp: payload.otp.trim(),
        newPassword: payload.newPassword,
      }),
    });

    const json: AuthApiResponse<boolean> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Đặt lại mật khẩu thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success) {
      const errorMsg = json.message || json.errors?.[0] || 'Mã OTP không chính xác hoặc đã hết hạn.';
      throw new Error(errorMsg);
    }

    return true;
  },

  /**
   * Cập nhật thông tin tài khoản gia chủ vào CSDL
   */
  async updateProfile(payload: {
    userId: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  }): Promise<AuthUser> {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId: payload.userId,
        fullName: payload.fullName.trim(),
        email: payload.email?.trim() || '',
        phoneNumber: payload.phoneNumber?.trim() || '',
        avatarUrl: payload.avatarUrl?.trim() || '',
      }),
    });

    const json: AuthApiResponse<AuthUser> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Cập nhật thông tin thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success || !json.data) {
      const errorMsg = json.message || json.errors?.[0] || 'Cập nhật thông tin thất bại.';
      throw new Error(errorMsg);
    }

    return json.data;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(payload: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<boolean> {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId: payload.userId,
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      }),
    });

    const json: AuthApiResponse<boolean> = await res.json().catch(() => ({
      success: false,
      data: null,
      message: `Đổi mật khẩu thất bại (HTTP ${res.status})`,
      errors: [],
    }));

    if (!res.ok || !json.success) {
      const errorMsg = json.message || json.errors?.[0] || 'Đổi mật khẩu thất bại.';
      throw new Error(errorMsg);
    }

    return true;
  },

  /**
   * Đăng xuất tài khoản (kèm Bearer Access Token)
   */
  async logout(): Promise<void> {
    const token = authStorage.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Backend logout notification failed:', err);
      }
    }
    authStorage.clearAll();
  },
};

