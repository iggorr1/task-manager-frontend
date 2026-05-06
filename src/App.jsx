import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tasks, setTasks] = useState([]);

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8080/users/login", {
        login,
        password,
      });

      const jwt = response.data.token;

      setToken(jwt);
      localStorage.setItem("token", jwt);

      await fetchTasks(jwt);
    } catch (error) {
      alert("Login failed");
      console.error(error);
    }
  }

  async function fetchTasks(jwt = token) {
    try {
      const response = await axios.get("http://localhost:8080/tasks", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      setTasks(response.data.content);
    } catch (error) {
      alert("Failed to load tasks");
      console.error(error);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
  }

  return (
      <div className="app">
        <div className="login-card">
          <h1>Task Manager</h1>

          {!token ? (
              <>
                <p>Login to your account</p>

                <form onSubmit={handleLogin}>
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

                  <button type="submit">Login</button>
                </form>
              </>
          ) : (
              <>
                <div className="top-bar">
                  <p className="success">Logged in</p>
                  <button className="secondary-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>

                <button onClick={() => fetchTasks()}>Refresh tasks</button>

                <div className="tasks-list">
                  {tasks.length === 0 ? (
                      <p>No tasks yet</p>
                  ) : (
                      tasks.map((task) => (
                          <div className="task-card" key={task.id}>
                            <h3>{task.title}</h3>
                            <p>{task.description}</p>
                            <span>{task.status}</span>
                          </div>
                      ))
                  )}
                </div>
              </>
          )}
        </div>
      </div>
  );
}

export default App;