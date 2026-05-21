import { useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import TasksPage from "./pages/TasksPage";
import Sidebar from "./components/layout/Sidebar";
import TelegramSettingsModal from "./components/telegram/TelegramSettingsModal";
import DeleteTaskModal from "./components/tasks/DeleteTaskModal";
import {
  adminApi,
  authApi,
  getRequestErrorMessage,
  isSessionAuthError,
  isUnauthorizedError,
  taskApi,
  telegramApi,
} from "./api/taskFlowApi";
import {
  DESCRIPTION_MAX_LENGTH,
  EMPTY_ADMIN_DATA,
  EMPTY_TELEGRAM_STATUS,
  STATUS_STORAGE_KEY,
  SORT_STORAGE_KEY,
  TITLE_MAX_LENGTH,
} from "./constants/taskFlow";
import "./App.css";

function App() {
  const oauthParams = new URLSearchParams(window.location.search);
  const isOauthCallback = window.location.pathname === "/oauth/success";
  const oauthToken = isOauthCallback ? oauthParams.get("token") : "";
  const oauthLogin = isOauthCallback ? oauthParams.get("login") : "";

  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(oauthToken || localStorage.getItem("token") || "");
  const [currentLogin, setCurrentLogin] = useState(oauthLogin || localStorage.getItem("login") || "");
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
  const [message, setMessage] = useState(oauthToken ? "Google login successful." : null);
  const [messageType, setMessageType] = useState("success");
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(EMPTY_TELEGRAM_STATUS);
  const [telegramLink, setTelegramLink] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [reminderInputs, setReminderInputs] = useState({});
  const [reminderLoadingTaskId, setReminderLoadingTaskId] = useState(null);
  const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
  const [openReminderTaskId, setOpenReminderTaskId] = useState(null);
  const [activeView, setActiveView] = useState("tasks");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(EMPTY_ADMIN_DATA);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    if (!oauthToken) {
      return;
    }

    localStorage.setItem("token", oauthToken);

    if (oauthLogin) {
      localStorage.setItem("login", oauthLogin);
    }

    window.history.replaceState({}, "", "/");
    fetchTasks(oauthToken, selectedStatus, searchTitle, sort);
    fetchAllTasks(oauthToken);
    fetchTelegramStatus(oauthToken, false);
    checkAdminAccess(oauthToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchTasks(token, selectedStatus, searchTitle, sort);
    fetchAllTasks(token);
    fetchTelegramStatus(token, false);
    checkAdminAccess(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (openTaskMenuId === null) {
      return;
    }

    function handleDocumentClick(event) {
      if (!event.target.closest(".task-menu-wrapper")) {
        closeTaskMenu();
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [openTaskMenuId]);

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

  function handleExpiredSession() {
    handleLogout();
    showMessage("Session expired. Please log in again.", "error");
  }

  async function checkAdminAccess(jwt = token) {
    if (!jwt) {
      setIsAdmin(false);
      return false;
    }

    try {
      await adminApi.getStats(jwt);
      setIsAdmin(true);
      return true;
    } catch (error) {
      const status = error?.response?.status;
      setIsAdmin(false);

      if (status === 401) {
        handleExpiredSession();
        return false;
      }

      if (status !== 403) {
        console.error("Admin access check failed:", {
          status,
          message: error?.response?.data?.message || error?.message,
        });
      }

      return false;
    }
  }

  function useDemoAccount() {
    clearMessage();
    setAuthMode("login");
    setLogin("demo");
    setPassword("demo123");
  }

  function handleGoogleLogin() {
    window.location.href = authApi.getGoogleLoginUrl();
  }

  async function handleRegister(e) {
    e.preventDefault();
    clearMessage();

    try {
      await authApi.register({
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
      const response = await authApi.login({
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
      await checkAdminAccess(jwt);
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

      const response = await taskApi.getTasks(jwt, params);

      setTasks(sortPinnedFirst(response.data.content));
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage("Failed to load tasks", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function fetchAllTasks(jwt = token) {
    try {
      const response = await taskApi.getTasks(jwt, {
        page: 0,
        size: 1000,
        sort: "createdAt,desc",
      });

      setAllTasks(response.data.content);
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage("Failed to load task counters", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  async function fetchAdminData(jwt = token) {
    if (!jwt) {
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const [statsResponse, usersResponse, tasksResponse] = await Promise.all([
        adminApi.getStats(jwt),
        adminApi.getUsers(jwt),
        adminApi.getTasks(jwt),
      ]);

      setAdminData({
        stats: statsResponse.data,
        users: usersResponse.data || [],
        tasks: tasksResponse.data || [],
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleExpiredSession();
        return;
      }

      const status = error?.response?.status;
      const errorMessage =
        status === 403
          ? "Admin access required."
          : status === 401
            ? "Login again to view admin panel."
            : getRequestErrorMessage(error, "Failed to load admin data");

      setAdminError(errorMessage);
      setAdminData(EMPTY_ADMIN_DATA);
      console.error("Request failed:", {
        status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setAdminLoading(false);
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
      await taskApi.createTask(token, {
        title: newTitle,
        description: newDescription,
      });

      setNewTitle("");
      setNewDescription("");

      await fetchTasks();
      await fetchAllTasks();
      showMessage("Task created.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage(getRequestErrorMessage(error, "Failed to create task"), "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  function startEdit(task) {
    setOpenTaskMenuId(null);
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
      await taskApi.updateTask(token, taskId, {
        title: editTitle,
        description: editDescription,
      });

      cancelEdit();
      await fetchTasks();
      await fetchAllTasks();
      showMessage("Task updated.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

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
      const response = await taskApi.togglePin(token, taskId);

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
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

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
      await taskApi.updateStatus(token, taskId, { status });

      await fetchTasks();
      await fetchAllTasks();
      showMessage("Task status updated.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

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
      await taskApi.deleteTask(token, taskId);

      await fetchTasks();
      await fetchAllTasks();
      setTaskIdToDelete(null);
      showMessage("Task deleted.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage("Failed to delete task", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    }
  }

  function handleStatusFilter(status) {
    setActiveView("tasks");
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

  async function openAdminPanel() {
    clearMessage();
    setActiveView("admin");
    await fetchAdminData(token);
  }

  async function fetchTelegramStatus(jwt = token, shouldShowMessage = false) {
    if (!jwt) {
      return;
    }

    setTelegramLoading(true);

    try {
      const response = await telegramApi.getStatus(jwt);

      setTelegramStatus(response.data || EMPTY_TELEGRAM_STATUS);

      if (shouldShowMessage) {
        showMessage("Telegram status refreshed.");
      }
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

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
      const response = await telegramApi.createLink(token);

      setTelegramLink(response.data.link);
      showMessage("Telegram link created.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

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
      await telegramApi.disconnect(token);

      setTelegramStatus(EMPTY_TELEGRAM_STATUS);
      setTelegramLink("");
      showMessage("Telegram disconnected.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage("Failed to disconnect Telegram", "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setTelegramLoading(false);
    }
  }

  function updateReminderInput(taskId, field, value) {
    setReminderInputs((prevInputs) => ({
      ...prevInputs,
      [taskId]: {
        ...getReminderInputValueByTaskId(taskId),
        ...prevInputs[taskId],
        [field]: value,
      },
    }));
  }

  async function setTaskReminder(taskId) {
    clearMessage();

    const reminderValue = getReminderInputValueByTaskId(taskId);
    const reminderDateValue = reminderValue.date;
    const reminderHourValue = reminderValue.hour;
    const reminderMinuteValue = reminderValue.minute;

    if (!reminderDateValue || !reminderHourValue || !reminderMinuteValue) {
      showMessage("Choose reminder date and time first.", "error");
      return;
    }

    const hourNumber = Number(reminderHourValue);
    const minuteNumber = Number(reminderMinuteValue);

    if (
      !/^\d{1,2}$/.test(reminderHourValue) ||
      !/^\d{1,2}$/.test(reminderMinuteValue) ||
      hourNumber < 0 ||
      hourNumber > 23 ||
      minuteNumber < 0 ||
      minuteNumber > 59
    ) {
      showMessage("Use 24-hour time format, for example 09:30 or 18:05.", "error");
      return;
    }

    const normalizedHour = String(hourNumber).padStart(2, "0");
    const normalizedMinute = String(minuteNumber).padStart(2, "0");

    const reminderDate = new Date(
      `${reminderDateValue}T${normalizedHour}:${normalizedMinute}:00`
    );

    if (Number.isNaN(reminderDate.getTime())) {
      showMessage("Reminder date is invalid.", "error");
      return;
    }

    if (reminderDate <= new Date()) {
      showMessage("Reminder time should be in the future.", "error");
      return;
    }

    setReminderLoadingTaskId(taskId);

    try {
      await taskApi.setReminder(token, taskId, {
        reminderAt: reminderDate.toISOString(),
      });

      await fetchTasks();
      await fetchAllTasks();
      setReminderInputs((prevInputs) => {
        const nextInputs = { ...prevInputs };
        delete nextInputs[taskId];
        return nextInputs;
      });
      setOpenReminderTaskId(null);
      showMessage("Reminder scheduled.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage(getRequestErrorMessage(error, "Failed to schedule reminder"), "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setReminderLoadingTaskId(null);
    }
  }

  async function deleteTaskReminder(taskId) {
    clearMessage();
    setReminderLoadingTaskId(taskId);

    try {
      await taskApi.deleteReminder(token, taskId);

      await fetchTasks();
      await fetchAllTasks();

      setReminderInputs((prevInputs) => {
        const nextInputs = { ...prevInputs };
        delete nextInputs[taskId];
        return nextInputs;
      });

      setOpenReminderTaskId(null);
      showMessage("Reminder deleted.");
    } catch (error) {
      if (isSessionAuthError(error)) {
        handleExpiredSession();
        return;
      }

      showMessage(getRequestErrorMessage(error, "Failed to delete reminder"), "error");
      console.error("Request failed:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
    } finally {
      setReminderLoadingTaskId(null);
    }
  }

  function toggleTaskMenu(taskId) {
    setOpenTaskMenuId((currentTaskId) =>
      currentTaskId === taskId ? null : taskId
    );
  }

  function closeTaskMenu() {
    setOpenTaskMenuId(null);
  }

  function openReminderForTask(taskId) {
    setOpenReminderTaskId(taskId);
    setOpenTaskMenuId(null);
  }

  function hideReminderPanel(taskId) {
    setOpenReminderTaskId((currentTaskId) =>
        currentTaskId === taskId ? null : currentTaskId
    );
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
    setReminderInputs({});
    setReminderLoadingTaskId(null);
    setOpenTaskMenuId(null);
    setOpenReminderTaskId(null);
    setActiveView("tasks");
    setIsAdmin(false);
    setAdminData(EMPTY_ADMIN_DATA);
    setAdminLoading(false);
    setAdminError("");
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

  function getReminderInputValue(task) {
    const savedValues = toReminderInputValues(task.reminderAt);

    if (reminderInputs[task.id] !== undefined) {
      return {
        ...savedValues,
        ...reminderInputs[task.id],
      };
    }

    return savedValues;
  }

  function getReminderInputValueByTaskId(taskId) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    const savedValues = toReminderInputValues(task?.reminderAt);

    if (reminderInputs[taskId] !== undefined) {
      return {
        ...savedValues,
        ...reminderInputs[taskId],
      };
    }

    return savedValues;
  }

  function toReminderInputValues(dateValue) {
    if (!dateValue) {
      return { date: "", hour: "", minute: "" };
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return { date: "", hour: "", minute: "" };
    }

    const pad = (value) => String(value).padStart(2, "0");

    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      hour: pad(date.getHours()),
      minute: pad(date.getMinutes()),
    };
  }

  function getRecentAdminTasks() {
    return [...adminData.tasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);
  }

  if (!token) {
    return (
      <AuthPage
        authMode={authMode}
        email={email}
        login={login}
        message={message}
        messageType={messageType}
        name={name}
        password={password}
        onAuthModeChange={setAuthMode}
        onEmailChange={setEmail}
        onLogin={handleLogin}
        onLoginChange={setLogin}
        onNameChange={setName}
        onPasswordChange={setPassword}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
        onUseDemoAccount={useDemoAccount}
      />
    );
  }

  const pageTitle = activeView === "admin"
    ? "Admin Panel"
    : selectedStatus
      ? selectedStatus.replace("_", " ")
      : "All tasks";

  const pageSubtitle = activeView === "admin"
    ? "Read-only overview of users, tasks and Telegram links"
    : tasks.length + " task" + (tasks.length === 1 ? "" : "s") + " loaded";

  return (
    <div className="workspace">
      <Sidebar
        activeView={activeView}
        currentLogin={currentLogin}
        isAdmin={isAdmin}
        searchTitle={searchTitle}
        selectedStatus={selectedStatus}
        sort={sort}
        telegramConnected={telegramStatus.connected}
        getStatusCount={getStatusCount}
        onAdminOpen={openAdminPanel}
        onClearSearch={clearSearch}
        onLogout={handleLogout}
        onSearch={handleSearch}
        onSearchTitleChange={setSearchTitle}
        onSortChange={handleSortChange}
        onStatusFilter={handleStatusFilter}
        onTelegramOpen={openTelegramSettings}
      />

      <main className="main">
        <header className="main-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
        </header>

        {message && (
          <div className={"message-banner " + messageType}>
            {message}
          </div>
        )}

        {activeView === "admin" ? (
          <AdminDashboard
            adminData={adminData}
            adminError={adminError}
            adminLoading={adminLoading}
            getRecentAdminTasks={getRecentAdminTasks}
            onRefresh={() => fetchAdminData(token)}
          />
        ) : (
          <TasksPage
            editDescription={editDescription}
            editTitle={editTitle}
            editingTaskId={editingTaskId}
            newDescription={newDescription}
            newTitle={newTitle}
            openReminderTaskId={openReminderTaskId}
            openTaskMenuId={openTaskMenuId}
            reminderLoadingTaskId={reminderLoadingTaskId}
            tasks={tasks}
            telegramConnected={telegramStatus.connected}
            cancelEdit={cancelEdit}
            closeTaskMenu={closeTaskMenu}
            createTask={createTask}
            deleteTaskReminder={deleteTaskReminder}
            getReminderInputValue={getReminderInputValue}
            hideReminderPanel={hideReminderPanel}
            openReminderForTask={openReminderForTask}
            saveEdit={saveEdit}
            setEditDescription={setEditDescription}
            setEditTitle={setEditTitle}
            setNewDescription={setNewDescription}
            setNewTitle={setNewTitle}
            setTaskIdToDelete={setTaskIdToDelete}
            setTaskReminder={setTaskReminder}
            startEdit={startEdit}
            togglePinTask={togglePinTask}
            toggleTaskMenu={toggleTaskMenu}
            updateReminderInput={updateReminderInput}
            updateTaskStatus={updateTaskStatus}
          />
        )}

        {isTelegramModalOpen && (
          <TelegramSettingsModal
            telegramLink={telegramLink}
            telegramLoading={telegramLoading}
            telegramStatus={telegramStatus}
            onClose={closeTelegramSettings}
            onCreateLink={createTelegramLink}
            onDisconnect={disconnectTelegram}
            onRefresh={() => fetchTelegramStatus(token, true)}
          />
        )}

        {taskIdToDelete && (
          <DeleteTaskModal
            onCancel={() => setTaskIdToDelete(null)}
            onConfirm={() => deleteTask(taskIdToDelete)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
