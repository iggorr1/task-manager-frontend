function AuthPage({
  authMode,
  email,
  login,
  message,
  messageType,
  name,
  password,
  onAuthModeChange,
  onEmailChange,
  onLogin,
  onLoginChange,
  onNameChange,
  onPasswordChange,
  onRegister,
  onUseDemoAccount,
}) {
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

        <form onSubmit={authMode === "login" ? onLogin : onRegister}>
          {authMode === "register" && (
            <>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
              />

              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
              />
            </>
          )}

          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Login"
            value={login}
            onChange={(event) => onLoginChange(event.target.value)}
          />

          <input
            type="password"
            name="password"
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
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
            onClick={onUseDemoAccount}
          >
            Use demo account
          </button>
        </div>

        <button
          className="auth-switch-button"
          onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
        >
          {authMode === "login"
            ? "No account? Register"
            : "Already have account? Login"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
