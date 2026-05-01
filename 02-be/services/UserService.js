import { pool } from '../config/dbpg.js';
import bcrypt from 'bcrypt';
import { playlistService } from './PlaylistService.js';
// Avatar mặc định cho tài khoản mới 
export const USER_DEFAULT_AVATAR = '/assets/img/avatars/avatar.png';

// Chuẩn hóa dữ liệu user từ DB về object dùng cho API.
function mapUserAttributes(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    avatar: row.avatar
  };
}

// Tìm user theo username + password (dùng cho đăng nhập).
export async function getUserByCredentials({ username, password }) {
  const query = `
    SELECT *
    FROM "user"
    WHERE username = $1 AND password = $2
    LIMIT 1
  `;
  const result = await pool.query(query, [username, password]);
  return mapUserAttributes(result.rows[0]);
}

// Lấy thông tin user theo id.
export async function getUserById(userId) {
  const query = `
    SELECT id, username
    FROM "user"
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [userId]);
  return mapUserAttributes(result.rows[0]);
}

// Kiểm tra username đã tồn tại chưa (không phân biệt hoa thường).
export async function isUsernameTaken(username) {
  const query = `
    SELECT id
    FROM "user"
    WHERE LOWER(username) = LOWER($1)
    LIMIT 1
  `;

  const result = await pool.query(query, [username]);
  return result.rows.length > 0;
}

// Tạo user mới với role mặc định là "user".
export async function createUser({ username, password }) {
  const query = `
    INSERT INTO "user" (username, password, role, avatar)
    VALUES ($1, $2, 'user', $3)
    RETURNING id, username, role, avatar
  `;
  const result = await pool.query(query, [username, password, USER_DEFAULT_AVATAR]);
  await playlistService.createPlaylist({
    name: `Nhạc của ${username}`,
    creatorId: result.rows[0].id,
    ispublic: false,
    isDefault: true
  });
  return mapUserAttributes(result.rows[0]);
}

// Export dạng object để tiện import theo service tổng hợp.
const userService = {
  USER_DEFAULT_AVATAR,
  mapUserAttributes,
  getUserByCredentials,
  getUserById,
  isUsernameTaken,
  createUser,
};

export default userService;