import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://api.wwwho.lol";

const STATUSES = [
  { label: "All tasks", value: "" },
  { label: "TODO", value: "TODO" },
  { label: "IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "DONE", value: "DONE" },
];

function App() {
  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [sort, setSort] = useState("createdAt,desc");

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchTasks(token, selectedStatus, searchTitle, sort);
    fetchAllTasks(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRegister(e) {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/users/register`, {
        name,
        email,
        login,
        password,
      });

      alert("Register successful. Now login.");
      setAuthMode("login");
    } catch (error) {
      alert("Register failed");
      console.error(error);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        login,
        password,
      });

      const jwt = response.data.token;

      setToken(jwt);
      localStorage.setItem("token", jwt);

      await fetchTasks(jwt, selectedStatus, searchTitle, sort);
      await fetchAllTasks(jwt);
    } catch (error) {
      alert("Login failed");
      console.error(error);
    }
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

      setTasks(response.data.content);
    } catch (error) {
      alert("Failed to load tasks");
      console.error(error);
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
      alert("Failed to load task counters");
      console.error(error);
    }
  }

  async function createTask(e) {
    e.preventDefault();

    if (!newTitle.trim()) {
      alert("Title is required");
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
    } catch (error) {
      alert("Failed to create task");
      console.error(error);
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
    if (!editTitle.trim()) {
      alert("Title is required");
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
    } catch (error) {
      alert("Failed to update task");
      console.error(error);
    }
  }

  async function updateTaskStatus(taskId, status) {
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
    } catch (error) {
      alert("Failed to update task status");
      console.error(error);
    }
  }

  async function deleteTask(taskId) {
    const confirmed = confirm("Delete this task?");

    if (!confirmed) {
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
    } catch (error) {
      alert("Failed to delete task");
      console.error(error);
    }
  }

  function handleStatusFilter(status) {
    setSelectedStatus(status);
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
    fetchTasks(token, selectedStatus, searchTitle, value);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    setAllTasks([]);
    setLogin("");
    setPassword("");
    setName("");
    setEmail("");
    cancelEdit();
  }

  function getStatusCount(status) {
    if (!status) {
      return allTasks.length;
    }

    return allTasks.filter((task) => task.status === status).length;
  }

  if (!token) {
    return (
        <div className="auth-page">
          <div className="auth-card">
            <div className="app-logo">TM</div>

            <h1>Task Manager</h1>
            <p>{authMode === "login" ? "Login to your workspace" : "Create account"}</p>

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "register" && (
                  <>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                  </>
              )}

              <input
                  type="text"
                  placeholder="Login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
              />

              <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit">
                {authMode === "login" ? "Login" : "Register"}
              </button>
            </form>

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
            <div className="app-logo small">TM</div>
            <div>
              <h2>Task Manager</h2>
              <p>Workspace</p>
            </div>
          </div>

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

          <section className="create-panel">
            <form onSubmit={createTask}>
              <input
                  type="text"
                  placeholder="New task title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
              />

              <input
                  type="text"
                  placeholder="Description"
                  value={newDescription}
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
                    <article className="task-card" key={task.id}>
                      <div className="task-card-header">
                        <h3>{task.title}</h3>
                        <span className={`status-badge ${task.status?.toLowerCase()}`}>
                    {task.status || "NO_STATUS"}
                  </span>
                      </div>

                      {editingTaskId === task.id ? (
                          <div className="edit-task-form">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />

                            <input
                                type="text"
                                value={editDescription}
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
                                  onClick={() => deleteTask(task.id)}
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
        </main>
      </div>
  );
}

export default App;
