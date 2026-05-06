import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8080/users/login", {
        login,
        password,
      });

      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);

      alert("Login successful");
    } catch (error) {
      alert("Login failed");
      console.error(error);
    }
  }

  return (
      <div className="app">
        <div className="login-card">
          <h1>Task Manager</h1>
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

          {token && <p className="success">Token saved</p>}
        </div>
      </div>
  );
}

export default App;