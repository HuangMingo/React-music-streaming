import { createContext, useContext, useMemo, useState } from 'react';
import { clearMusicStorage } from './MusicContext';

const AUTH_SESSION_KEY = 'mp_auth_session';

const API_BASE_URL = 'http://localhost:3000';

const AuthContext = createContext(null);

function getStoredSession() {
  try {
    // Chỉ lưu thông tin phiên đăng nhập tối thiểu để giữ trạng thái sau khi tải lại trang.
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

async function requestJson(path, body) {
  // Tách riêng lớp gọi API để login và register dùng chung một luồng xử lý.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { ok: false, message: data.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.' };
  }

  return { ok: true, ...data };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredSession());

  const register = async ({ username, password }) => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      return { ok: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' };
    }

    if (normalizedPassword.length < 4) {
      return { ok: false, message: 'Mật khẩu cần ít nhất 4 ký tự.' };
    }

    // Đăng ký xong là lưu phiên ngay để vào thẳng khu cá nhân.
    const result = await requestJson('/api/auth/register', {
      username: normalizedUsername,
      password: normalizedPassword,
    });

    if (!result.ok) {
      return result;
    }

    clearMusicStorage();
    setCurrentUser(result.user);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(result.user));

    return { ok: true, user: result.user };
  };

  const login = async ({ username, password }) => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();
    
    // Đăng nhập thật dựa trên dữ liệu trong database.
    const result = await requestJson('/api/auth/login', {
      username: normalizedUsername,
      password: normalizedPassword,
    });

    if (!result.ok) {
      return result;
    }

    clearMusicStorage();
    setCurrentUser(result.user);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(result.user));

    return { ok: true, user: result.user };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    clearMusicStorage();
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.role === 'admin',
      register,
      login,
      logout,
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
