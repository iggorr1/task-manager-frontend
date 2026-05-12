import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "https://api.wwwho.lol";

const STATUSES = [
  { label: "All tasks", value: "" },
  { label: "TODO", value: "TODO" },
  { label: "IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "DONE", value: "DONE" },
];

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 255;
const STATUS_STORAGE_KEY = "taskflow:selectedStatus";
const SORT_STORAGE_KEY = "taskflow:sort";

const EMPTY_TELEGRAM_STATUS = {
  connected: false,
  telegramUsername: null,
  connectedAt: null,
};

function PinIcon({ filled = false }) {
  return (
    <svg
      className="pin-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M16 3l5 5-3 1-4 4v5l-2 2-3-6-6-3 2-2h5l4-4 1-3z"
        fill={filled ? "currentColor" : "none"}
      />
      <path
        d="M9.0 15.0L5.2 21"
        fill="none"
      />
    </svg>
  );
}

function App() {
  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentLogin, setCurrentLogin] = useState(localStorage.getItem("login") || "");
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [selectedStatus, setSelectedStatus] = useState(
      localStorage.getItem(STATUS_STORAGE_KEY) || ""
  );
  const [searchTitle, setSearchTitle] = useState("");
  const [sort, setSort] = useState(
      localStorage.getItem(SORT_STORAGE_KEY) || "createdAt,desc"
  );

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [taskIdToDelete, setTaskIdToDelete] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(EMPTY_TELEGRAM_STATUS);
  const [telegramLink, setTelegramLink] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchTasks(token, selectedStatus, searchTitle, sort);
    fetchAllTasks(token);
    fetchTelegramStatus(token, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  function clearMessage() {
    setMessage(null);
    setMessageType("success");
  }

  function getTaskValidationMessage(title, description) {
    if (!title.trim()) {
      return "Title is required";
    }

    if (title.length > TITLE_MAX_LENGTH) {
      return `Title is too long. Maximum ${TITLE_MAX_LENGTH} characters.`;
    }

    if (description.length > DESCRIPTION_MAX_LENGTH) {
      return `Description is too long. Maximum ${DESCRIPTION_MAX_LENGTH} characters.`;
    }

    return null;
  }

  function getRequestErrorMessage(error, fallbackMessage) {
    const backendMessage = error?.response?.data?.message;

    if (backendMessage) {
      return backendMessage;
    }

    return fallbackMessage;
  }

  function useDemoAccount() {
    clearMessage();
    setAuthMode("login");
    setLogin("demo");
    setPassword("demo123");
  }

  async function handleRegister(e) {
    e.preventDefault();
    clearMessage();

    try {
      await axios.post(`${API_URL}/users/register`, {
        name,
        email,
        login,
        password,
      });

      showMessage("Registration successful. Now login.");
      setAuthMode("login");
    } catch (error) {
      showMessage("Register failed", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearMessage();

    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        login,
        password,
      });

      const jwt = response.data.token;

      setToken(jwt);
      localStorage.setItem("token", jwt);
      setCurrentLogin(login);
      localStorage.setItem("login", login);

      await fetchTasks(jwt, selectedStatus, searchTitle, sort);
      await fetchAllTasks(jwt);
      showMessage("Login successful.");
    } catch (error) {
      showMessage("Login failed", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  function sortPinnedFirst(taskList) {
    return [...taskList].sort((a, b) => {
      if (a.pinned === b.pinned) {
        return 0;
      }

      return a.pinned ? -1 : 1;
    });
  }

  async function fetchTasks(
      jwt = token,
      status = selectedStatus,
      title = searchTitle,
      sortValue = sort
  ) {
    try {
      const params = {
        page: 0,
        size: 50,
        sort: sortValue,
      };

      if (status) {
        params.status = status;
      }

      if (title.trim()) {
        params.title = title.trim();
      }

      const response = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        params,
      });

      setTasks(sortPinnedFirst(response.data.content));
    } catch (error) {
      showMessage("Failed to load tasks", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function fetchAllTasks(jwt = token) {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        params: {
          page: 0,
          size: 1000,
          sort: "createdAt,desc",
        },
      });

      setAllTasks(response.data.content);
    } catch (error) {
      showMessage("Failed to load task counters", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function createTask(e) {
    e.preventDefault();
    clearMessage();

    const validationMessage = getTaskValidationMessage(newTitle, newDescription);
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return;
    }

    try {
      await axios.post(
          `${API_URL}/tasks`,
          {
            title: newTitle,
            description: newDescription,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      setNewTitle("");
      setNewDescription("");

      await fetchTasks();
      await fetchAllTasks();
      showMessage("Task created.");
    } catch (error) {
      showMessage(getRequestErrorMessage(error, "Failed to create task"), "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  function startEdit(task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
  }

  async function saveEdit(taskId) {
    clearMessage();

    const validationMessage = getTaskValidationMessage(editTitle, editDescription);
    if (validationMessage) {
      showMessage(validationMessage, "error");
      return;
    }

    try {
      await axios.put(
          `${API_URL}/tasks/${taskId}`,
          {
            title: editTitle,
            description: editDescription,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      cancelEdit();
      await fetchTasks();
      await fetchAllTasks();
      showMessage("Task updated.");
    } catch (error) {
      showMessage(getRequestErrorMessage(error, "Failed to update task"), "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function togglePinTask(taskId) {
    clearMessage();

    try {
      const response = await axios.patch(
          `${API_URL}/tasks/${taskId}/pin`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const updatedTask = response.data;

      setTasks((prevTasks) =>
        sortPinnedFirst(
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        )
      );

      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
    } catch (error) {
      showMessage("Failed to update pin status", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function updateTaskStatus(taskId, status) {
    clearMessage();

    try {
      await axios.patch(
          `${API_URL}/tasks/${taskId}/status`,
          { status },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      await fetchTasks();
      await fetchAllTasks();
      showMessage("Task status updated.");
    } catch (error) {
      showMessage("Failed to update task status", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function deleteTask(taskId) {
    clearMessage();

    if (!taskId) {
      return;
    }


    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchTasks();
      await fetchAllTasks();
      setTaskIdToDelete(null);
      showMessage("Task deleted.");
    } catch (error) {
      showMessage("Failed to delete task", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  function handleStatusFilter(status) {
    setSelectedStatus(status);
    localStorage.setItem(STATUS_STORAGE_KEY, status);
    fetchTasks(token, status, searchTitle, sort);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchTasks(token, selectedStatus, searchTitle, sort);
  }

  function clearSearch() {
    setSearchTitle("");
    fetchTasks(token, selectedStatus, "", sort);
  }

  function handleSortChange(e) {
    const value = e.target.value;
    setSort(value);
    localStorage.setItem(SORT_STORAGE_KEY, value);
    fetchTasks(token, selectedStatus, searchTitle, value);
  }

  async function fetchTelegramStatus(jwt = token, shouldShowMessage = false) {
    if (!jwt) {
      return;
    }

    setTelegramLoading(true);

    try {
      const response = await axios.get(`${API_URL}/telegram/status`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      setTelegramStatus(response.data || EMPTY_TELEGRAM_STATUS);

      if (shouldShowMessage) {
        showMessage("Telegram status refreshed.");
      }
    } catch (error) {
      showMessage("Failed to load Telegram status", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setTelegramLoading(false);
    }
  }

  async function openTelegramSettings() {
    setIsTelegramModalOpen(true);
    setTelegramLink("");
    await fetchTelegramStatus(token, false);
  }

  function closeTelegramSettings() {
    setIsTelegramModalOpen(false);
    setTelegramLink("");
  }

  async function createTelegramLink() {
    clearMessage();
    setTelegramLoading(true);

    try {
      const response = await axios.post(
          `${API_URL}/telegram/link`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      setTelegramLink(response.data.link);
      showMessage("Telegram link created.");
    } catch (error) {
      showMessage("Failed to create Telegram link", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setTelegramLoading(false);
    }
  }

  async function disconnectTelegram() {
    clearMessage();
    setTelegramLoading(true);

    try {
      await axios.delete(`${API_URL}/telegram/disconnect`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTelegramStatus(EMPTY_TELEGRAM_STATUS);
      setTelegramLink("");
      showMessage("Telegram disconnected.");
    } catch (error) {
      showMessage("Failed to disconnect Telegram", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setTelegramLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("login");
    setToken("");
    setCurrentLogin("");
    setTasks([]);
    setAllTasks([]);
    setLogin("");
    setPassword("");
    setName("");
    setEmail("");
    setTelegramStatus(EMPTY_TELEGRAM_STATUS);
    setTelegramLink("");
    setIsTelegramModalOpen(false);
    cancelEdit();
    setTaskIdToDelete(null);
    clearMessage();
  }

  function getStatusCount(status) {
    if (!status) {
      return allTasks.length;
    }

    return allTasks.filter((task) => task.status === status).length;
  }

  function formatTaskDate(dateValue) {
    if (!dateValue) {
      return "Unknown date";
    }

    return new Date(dateValue).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!token) {
    return (
        <div className="auth-page">
          <div className="auth-card">
            <div className="app-logo">TF</div>

            <h1>TaskFlow</h1>
            <p>{authMode === "login" ? "Login to your workspace" : "Create account"}</p>

            {message && (
                <div className={`message-banner ${messageType}`}>
                  {message}
                </div>
            )}

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "register" && (
                  <>
                    <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                  </>
              )}

              <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="Login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
              />

              <input
                  type="password"
                  name="password"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit">
                {authMode === "login" ? "Login" : "Register"}
              </button>
            </form>

            <div className="demo-account">
              <div>
                <strong>Demo account</strong>
                <p>Login: demo · Password: demo123</p>
              </div>

              <button
                  type="button"
                  onClick={useDemoAccount}
              >
                Use demo account
              </button>
            </div>

            <button
                className="auth-switch-button"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
            >
              {authMode === "login"
                  ? "No account? Register"
                  : "Already have account? Login"}
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="workspace">
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
                      selectedStatus === status.value
                          ? "sidebar-item active"
                          : "sidebar-item"
                    }
                    onClick={() => handleStatusFilter(status.value)}
                >
                  <span>{status.label}</span>
                  <span className="count">{getStatusCount(status.value)}</span>
                </button>
            ))}
          </nav>

          <div className="sidebar-section">
            <p className="section-title">Search</p>

            <form className="sidebar-form" onSubmit={handleSearch}>
              <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
              />

              <button type="submit">Search</button>

              {searchTitle && (
                  <button type="button" onClick={clearSearch}>
                    Clear
                  </button>
              )}
            </form>
          </div>

          <div className="sidebar-section">
            <p className="section-title">Sort</p>

            <select value={sort} onChange={handleSortChange}>
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
                onClick={openTelegramSettings}
            >
              <span>Telegram Settings</span>
              <span className={telegramStatus.connected ? "integration-dot connected" : "integration-dot"} />
            </button>
          </div>

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

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="main">
          <header className="main-header">
            <div>
              <h1>
                {selectedStatus ? selectedStatus.replace("_", " ") : "All tasks"}
              </h1>
              <p>
                {tasks.length} task{tasks.length === 1 ? "" : "s"} loaded
              </p>
            </div>
          </header>

          {message && (
              <div className={`message-banner ${messageType}`}>
                {message}
              </div>
          )}

          <section className="create-panel">
            <form onSubmit={createTask}>
              <input
                  type="text"
                  placeholder="New task title"
                  value={newTitle}
                  maxLength={TITLE_MAX_LENGTH}
                  onChange={(e) => setNewTitle(e.target.value)}
              />

              <input
                  type="text"
                  placeholder="Description"
                  value={newDescription}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  onChange={(e) => setNewDescription(e.target.value)}
              />

              <button type="submit">Create task</button>
            </form>
          </section>

          <section className="tasks-grid">
            {tasks.length === 0 ? (
                <div className="empty-state">
                  <h3>No tasks found</h3>
                  <p>Create a task or change filters in the sidebar.</p>
                </div>
            ) : (
                tasks.map((task) => (
                    <article
                        className={task.pinned ? "task-card pinned" : "task-card"}
                        key={task.id}
                    >
                      <div className="task-card-header">
                        <div className="task-title-block">
                          <h3>{task.title}</h3>

                          <span className={`status-badge ${task.status?.toLowerCase()}`}>
                            {task.status || "NO_STATUS"}
                          </span>
                        </div>

                        <div className="task-badges">
                          <button
                              type="button"
                              className={task.pinned ? "top-pin-button active" : "top-pin-button"}
                              onClick={() => togglePinTask(task.id)}
                              title={task.pinned ? "Unpin task" : "Pin task"}
                              aria-label={task.pinned ? "Unpin task" : "Pin task"}
                          >
                            <PinIcon filled={task.pinned} />
                          </button>
                        </div>
                      </div>

                      {editingTaskId === task.id ? (
                          <div className="edit-task-form">
                            <input
                                type="text"
                                value={editTitle}
                                maxLength={TITLE_MAX_LENGTH}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />

                            <input
                                type="text"
                                value={editDescription}
                                maxLength={DESCRIPTION_MAX_LENGTH}
                                onChange={(e) => setEditDescription(e.target.value)}
                            />

                            <div className="task-actions">
                              <button onClick={() => saveEdit(task.id)}>Save</button>
                              <button onClick={cancelEdit}>Cancel</button>
                            </div>
                          </div>
                      ) : (
                          <>
                            <p>{task.description || "No description"}</p>

                            <div className="task-meta">
                              Created: {formatTaskDate(task.createdAt)}
                            </div>

                            <div className="task-actions">
                              <button onClick={() => updateTaskStatus(task.id, "TODO")}>
                                TODO
                              </button>

                              <button
                                  onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                              >
                                Progress
                              </button>

                              <button onClick={() => updateTaskStatus(task.id, "DONE")}>
                                Done
                              </button>

                              <button onClick={() => startEdit(task)}>Edit</button>

                              <button
                                  className="danger-button"
                                  onClick={() => setTaskIdToDelete(task.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                      )}
                    </article>
                ))
            )}
          </section>

          <section className="credits-screenshot" aria-label="Project credits">
            <p>
              передаю привіт софії якби вона мені не написала я б не пофіксив баг зразу а на наступний день
            </p>
          </section>

          {isTelegramModalOpen && (
              <div
                  className="modal-backdrop"
                  role="presentation"
                  onClick={closeTelegramSettings}
              >
                <div
                    className="telegram-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="telegram-modal-title"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="telegram-modal-header">
                    <div>
                      <h3 id="telegram-modal-title">Telegram Settings</h3>
                      <p>Connect your Telegram chat to receive task reminders.</p>
                    </div>

                    <button
                        type="button"
                        className="modal-close-button"
                        onClick={closeTelegramSettings}
                        aria-label="Close Telegram settings"
                    >
                      ×
                    </button>
                  </div>

                  <div className="telegram-status-card">
                    <span>Status</span>
                    <strong>{telegramStatus.connected ? "Connected" : "Not connected"}</strong>
                    {telegramStatus.telegramUsername && (
                        <p>@{telegramStatus.telegramUsername}</p>
                    )}
                    {telegramStatus.connectedAt && (
                        <p>Connected: {formatTaskDate(telegramStatus.connectedAt)}</p>
                    )}
                  </div>

                  {!telegramStatus.connected ? (
                      <div className="telegram-connect-flow">
                        <button
                            type="button"
                            onClick={createTelegramLink}
                            disabled={telegramLoading}
                        >
                          {telegramLoading ? "Creating link..." : "Create Telegram link"}
                        </button>

                        {telegramLink && (
                            <div className="telegram-link-card">
                              <p>Open this link and press Start in Telegram:</p>
                              <a href={telegramLink} target="_blank" rel="noreferrer">
                                Open Telegram bot
                              </a>
                              <code>{telegramLink}</code>
                            </div>
                        )}
                      </div>
                  ) : (
                      <button
                          type="button"
                          className="danger-button telegram-disconnect-button"
                          onClick={disconnectTelegram}
                          disabled={telegramLoading}
                      >
                        {telegramLoading ? "Disconnecting..." : "Disconnect Telegram"}
                      </button>
                  )}

                  <button
                      type="button"
                      className="telegram-refresh-button"
                      onClick={() => fetchTelegramStatus(token, true)}
                      disabled={telegramLoading}
                  >
                    Refresh status
                  </button>
                </div>
              </div>
          )}

          {taskIdToDelete && (
              <div
                  className="modal-backdrop"
                  role="presentation"
                  onClick={() => setTaskIdToDelete(null)}
              >
                <div
                    className="delete-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                    onClick={(e) => e.stopPropagation()}
                >
                  <h3 id="delete-modal-title">Delete task?</h3>
                  <p>This action cannot be undone.</p>

                  <div className="delete-modal-actions">
                    <button
                        type="button"
                        onClick={() => setTaskIdToDelete(null)}
                    >
                      Cancel
                    </button>

                    <button
                        type="button"
                        className="danger-button"
                        onClick={() => deleteTask(taskIdToDelete)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
          )}

        </main>
      </div>
  );
}

export default App;






