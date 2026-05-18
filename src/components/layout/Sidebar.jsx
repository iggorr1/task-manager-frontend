import { STATUSES } from "../../constants/taskFlow";

function Sidebar({
  activeView,
  currentLogin,
  isAdmin,
  searchTitle,
  selectedStatus,
  sort,
  telegramConnected,
  getStatusCount,
  onAdminOpen,
  onClearSearch,
  onLogout,
  onSearch,
  onSearchTitleChange,
  onSortChange,
  onStatusFilter,
  onTelegramOpen,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo small">TF</div>
        <div>
          <h2>TaskFlow</h2>
          <p>Workspace</p>
        </div>
      </div>

      {currentLogin && (
        <div className="user-badge">
          <span>Logged in as</span>
          <strong>{currentLogin}</strong>
        </div>
      )}

      <nav className="sidebar-section">
        <p className="section-title">Views</p>

        {STATUSES.map((status) => (
          <button
            key={status.label}
            className={
              activeView === "tasks" && selectedStatus === status.value
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => onStatusFilter(status.value)}
          >
            <span>{status.label}</span>
            <span className="count">{getStatusCount(status.value)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <p className="section-title">Search</p>

        <form className="sidebar-form" onSubmit={onSearch}>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(event) => onSearchTitleChange(event.target.value)}
          />

          <button type="submit">Search</button>

          {searchTitle && (
            <button type="button" onClick={onClearSearch}>
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="sidebar-section">
        <p className="section-title">Sort</p>

        <select value={sort} onChange={onSortChange}>
          <option value="createdAt,desc">Newest first</option>
          <option value="createdAt,asc">Oldest first</option>
          <option value="title,asc">Title A-Z</option>
          <option value="title,desc">Title Z-A</option>
        </select>
      </div>

      <div className="sidebar-section">
        <p className="section-title">Integrations</p>

        <button
          type="button"
          className="telegram-settings-button"
          onClick={onTelegramOpen}
        >
          <span>Telegram Settings</span>
          <span className={telegramConnected ? "integration-dot connected" : "integration-dot"} />
        </button>
      </div>

      {isAdmin && (
        <div className="sidebar-section">
          <p className="section-title">Admin</p>

          <button
            type="button"
            className={activeView === "admin" ? "admin-panel-button active" : "admin-panel-button"}
            onClick={onAdminOpen}
          >
            <span>Admin Panel</span>
            <span className="admin-panel-dot" />
          </button>
        </div>
      )}

      <div className="project-links">
        <p className="section-title">Project</p>

        <a
          href="https://github.com/iggorr1"
          target="_blank"
          rel="noreferrer"
        >
          GitHub profile
        </a>
      </div>

      <button className="logout-button" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
