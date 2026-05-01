import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

export function AdminDashboardPage() {
  const { currentUser, isAdmin } = useAuthContext();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page dashboard-page">
      <div className="auth-card dashboard-card">
        <h1>Bảng quản trị Admin</h1>
        <p>Xin chào {currentUser.username}. Đây là giao diện quản trị.</p>
        <ul className="dashboard-list">
          <li>Quản lý người dùng và quyền truy cập.</li>
          <li>Kiểm duyệt nội dung âm nhạc.</li>
          <li>Tải nhạc lên thông qua mục Upload trong tab Cá nhân.</li>
        </ul>
      </div>
    </div>
  );
}
