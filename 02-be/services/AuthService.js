import userService from './UserService.js';

export async function loginUser({ username, password }) {
  return userService.getUserByCredentials({ username, password });
}

export async function registerUser({ username, password }) {
  const exists = await userService.isUsernameTaken(username);
  if (exists) {
    const error = new Error('Tài khoản đã tồn tại.');
    error.statusCode = 409;
    throw error;
  }

  return userService.createUser({ username, password });
}
