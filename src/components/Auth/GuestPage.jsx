import { Link } from 'react-router-dom';

export function GuestPage() {
  return (
    <div className="auth-page guest-page">
      <div className="auth-card guest-card" onClick={(event) => event.stopPropagation()}>
        <h1>Chào mừng đến với Mơ</h1>
        <div className="guest-actions">
          <Link className="header__auth-btn" to="/login">
            Đăng nhập
          </Link>
          <Link className="header__auth-btn header__auth-btn--outline" to="/register">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
}
