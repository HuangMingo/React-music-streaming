import './UserManagementPage.css';

export function UserManagementPage({
  active,
  isSuperAdmin,
  onUpdateRole,
  users,
}) {
  if (!active || !isSuperAdmin) {
    return null;
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3>Quản lý user</h3>
          <p>Nâng hoặc hạ quyền tài khoản</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td><span className="admin-role">{user.role}</span></td>
                <td>
                  {user.role === 'user' && (
                    <button type="button" onClick={() => onUpdateRole(user.id, 'admin')}>
                      Nâng admin
                    </button>
                  )}
                  {(user.role === 'user' || user.role === 'admin') && (
                    <button type="button" onClick={() => onUpdateRole(user.id, 'super_admin')}>
                      Nâng super admin
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button type="button" onClick={() => onUpdateRole(user.id, 'user')}>
                      Hạ user
                    </button>
                  )}
                  {user.role === 'super_admin' && (
                    <span>Không đổi</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
