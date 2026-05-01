import userService from '../services/UserService.js';

export const UserController = {
	async getUserById(req, res) {
		try {
			const userId = Number(req.params.id);

			if (!Number.isInteger(userId) || userId <= 0) {
				return res.status(400).json({ message: 'User id không hợp lệ.' });
			}

			const user = await userService.getUserById(userId);

			if (!user) {
				return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
			}

			res.json({ user });
		} catch (error) {
			console.error('Get user failed:', error);
			res.status(500).json({ message: 'Không thể lấy dữ liệu người dùng.' });
		}
	}
};