import { loginUser, registerUser } from '../services/AuthService.js';

export const AuthController = {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' });
            }

            const user = await loginUser({
                username: username.trim(),
                password: password.trim(),
            });

            if (!user) {
                return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu.' });
            }
            console.log('Logged in user:', user);
            res.json({ user });
        } catch (error) {
            console.error('Login failed:', error);
            res.status(500).json({ message: 'Không thể đăng nhập lúc này.' });
        }
    },

    async register(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' });
            }

            if (password.trim().length < 6) {
                return res.status(400).json({ message: 'Mật khẩu cần ít nhất 6 ký tự.' });
            }

            const user = await registerUser({
                username: username.trim(),
                password: password.trim(),
            });
            console.log('Registered user:', user);
            res.status(201).json({ user });
        } catch (error) {
            console.error('Register failed:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ message: error.message || 'Không thể đăng ký lúc này.' });
        }
    }
};
