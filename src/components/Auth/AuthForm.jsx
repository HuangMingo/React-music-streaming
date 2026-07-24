import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AuthForm({ title, submitLabel, footerText, footerAction, onSubmit }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const result = await onSubmit({ username, password });
    if (!result.ok) {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page auth-entry-page" onClick={footerAction.onDismiss}>
      
      <section className="auth-card auth-card--split" onClick={(event) => event.stopPropagation()}>
        <div className="auth-panel auth-panel--form">
          <h1>{title === 'Đăng nhập' ? 'Welcome Back!' : 'Create Your Account'}</h1>
          <p className="auth-subtitle">
            {title === 'Đăng nhập'
              ? 'Đăng nhập để tiếp tục nghe nhạc và quản lý playlist của bạn.'
              : 'Đăng ký tài khoản mới để cá nhân hóa trải nghiệm nghe nhạc.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Nhập username"
            />

            <label htmlFor="password">Password:</label>
            <div className="auth-password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="auth-submit-btn">
              {submitLabel}
            </button>
          </form>

          <p className="auth-footer">
            {footerText} <Link to={footerAction.to}>{footerAction.label}</Link>
          </p>
        </div>

        <div className="auth-panel auth-panel--visual" aria-hidden="true">
          <img src="/assets/img/logos/girl_with_music.png" alt="" className="auth-illustration" />
        </div>
      </section>
    </div>
  );
}
