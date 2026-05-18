import { formatOptionalDate, formatTelegramUsername } from "../utils/formatters";

function AdminDashboard({
  adminData,
  adminError,
  adminLoading,
  getRecentAdminTasks,
  onRefresh,
}) {
  return (
    <section className="admin-dashboard">
      <div className="admin-toolbar">
        <div>
          <h2>System overview</h2>
          <p>Protected by backend <code>/admin/**</code> role checks.</p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={adminLoading}
        >
          {adminLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {adminError && (
        <div className="admin-error-card">
          <strong>{adminError}</strong>
          <p>Use an account with ADMIN role and login again after changing role in database.</p>
        </div>
      )}

      {adminLoading && !adminData.stats ? (
        <div className="admin-loading-card">Loading admin data...</div>
      ) : (
        <>
          <div className="admin-stats-grid">
            <article className="admin-stat-card">
              <span>Total users</span>
              <strong>{adminData.stats?.totalUsers ?? 0}</strong>
            </article>

            <article className="admin-stat-card">
              <span>Total tasks</span>
              <strong>{adminData.stats?.totalTasks ?? 0}</strong>
            </article>

            <article className="admin-stat-card todo">
              <span>TODO</span>
              <strong>{adminData.stats?.todoTasks ?? 0}</strong>
            </article>

            <article className="admin-stat-card progress">
              <span>In progress</span>
              <strong>{adminData.stats?.inProgressTasks ?? 0}</strong>
            </article>

            <article className="admin-stat-card done">
              <span>Done</span>
              <strong>{adminData.stats?.doneTasks ?? 0}</strong>
            </article>
          </div>

          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <h3>Users</h3>
                <p>{adminData.users.length} account{adminData.users.length === 1 ? "" : "s"}</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Login</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Telegram</th>
                    <th>Chat ID</th>
                    <th>Connected</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="admin-empty-cell">No users loaded</td>
                    </tr>
                  ) : (
                    adminData.users.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td>
                          <strong>{user.login || "—"}</strong>
                          {user.name && <span>{user.name}</span>}
                        </td>
                        <td>{user.email || "—"}</td>
                        <td>
                          <span className={user.role === "ADMIN" ? "admin-role-badge" : "user-role-badge"}>
                            {user.role || "USER"}
                          </span>
                        </td>
                        <td>{formatTelegramUsername(user.telegramUsername)}</td>
                        <td>{user.telegramChatId || "—"}</td>
                        <td>{formatOptionalDate(user.telegramConnectedAt)}</td>
                        <td>{formatOptionalDate(user.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-header">
              <div>
                <h3>Recent tasks</h3>
                <p>Latest {Math.min(getRecentAdminTasks().length, 8)} of {adminData.tasks.length}</p>
              </div>
            </div>

            <div className="admin-task-list">
              {getRecentAdminTasks().length === 0 ? (
                <div className="admin-empty-card">No tasks loaded</div>
              ) : (
                getRecentAdminTasks().map((task) => (
                  <article className="admin-task-row" key={task.id}>
                    <div className="admin-task-main">
                      <div>
                        <span className="admin-task-id">#{task.id}</span>
                        <h4>{task.title || "Untitled task"}</h4>
                      </div>
                      <p>{task.description || "No description"}</p>
                    </div>

                    <div className="admin-task-meta-grid">
                      <span className={`status-badge ${task.status?.toLowerCase()}`}>
                        {task.status || "NO_STATUS"}
                      </span>
                      <span>Owner: {task.userLogin || `#${task.userId}`}</span>
                      <span>Created: {formatOptionalDate(task.createdAt)}</span>
                      <span>Reminder: {formatOptionalDate(task.reminderAt)}</span>
                      {task.pinned && <span className="admin-soft-badge">Pinned</span>}
                      {task.reminderSent && <span className="admin-soft-badge success">Reminder sent</span>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default AdminDashboard;
