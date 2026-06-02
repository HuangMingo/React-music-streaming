import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { AuthForm } from './AuthForm';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const handleRegister = async (credentials) => {
    const result = await register(credentials);
    if (result.ok) {
      navigate('/');
    }
    return result;
  };

  return (
    <AuthForm
      title="Đăng ký"
      submitLabel="Đăng ký"
      footerText="Đã có tài khoản?"
      footerAction={{
        to: '/login',
        label: 'Đăng nhập',
        onDismiss: () => navigate('/personal'),
      }}
      onSubmit={handleRegister}
    />
  );
}
