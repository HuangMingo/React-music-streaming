import { pool } from '../config/dbpg.js';

const ADMIN_ROLES = ['admin', 'super_admin'];
const SUPER_ADMIN_ROLE = 'super_admin';

let roleColumnReady = false;

export async function ensureUserRoleColumn() {
  if (roleColumnReady) {
    return;
  }

  await pool.query(`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
  `);
  roleColumnReady = true;
}

function getRequestUserId(req) {
  return req.headers['x-user-id'] || req.query.userId || req.body.userId;
}

async function getRequestUser(req) {
  await ensureUserRoleColumn();

  const userId = Number(getRequestUserId(req));
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const result = await pool.query(
    'SELECT id, username, role FROM "user" WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await getRequestUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này.' });
      }

      req.authUser = user;
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(500).json({ success: false, message: 'Không thể kiểm tra quyền truy cập.' });
    }
  };
}

export const requireAdminContent = requireRole(ADMIN_ROLES);
export const requireSuperAdmin = requireRole([SUPER_ADMIN_ROLE]);
