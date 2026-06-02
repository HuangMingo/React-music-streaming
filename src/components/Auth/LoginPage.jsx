import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { AuthForm } from './AuthForm';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleLogin = async (credentials) => {
    const result = await login(credentials);
    if (result.ok) {
      navigate('/');
    }
    return result;
  };

  return (
    <AuthForm
      title="Đăng nhập"
      submitLabel="Đăng nhập"
      footerText="Chưa có tài khoản?"
      footerAction={{
        to: '/register',
        label: 'Đăng ký ngay',
        onDismiss: () => navigate('/personal'),
      }}
      onSubmit={handleLogin}
    />
  );
}
