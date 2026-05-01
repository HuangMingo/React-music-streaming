import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

export function UserDashboardPage() {
  const { currentUser, isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="auth-page dashboard-page">
      <div className="auth-card dashboard-card">
        <h1>Xin chào, {currentUser.username}</h1>
        <p>Đây là trang dành cho người đã đăng nhập.</p>
        <ul className="dashboard-list">
          <li>Bạn có thể nghe nhạc, tạo playlist, theo dõi nghệ sĩ.</li>
          <li>Tính năng tải nhạc lên chỉ dành cho admin.</li>
          <li>Chọn avatar trên header để đăng xuất bất kỳ lúc nào.</li>
        </ul>
      </div>
    </div>
  );
}
