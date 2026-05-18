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

const EMPTY_ADMIN_DATA = {
  stats: null,
  users: [],
  tasks: [],
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
  const [reminderInputs, setReminderInputs] = useState({});
  const [reminderLoadingTaskId, setReminderLoadingTaskId] = useState(null);
  const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
  const [openReminderTaskId, setOpenReminderTaskId] = useState(null);
  const [hiddenReminderTaskIds, setHiddenReminderTaskIds] = useState([]);
  const [activeView, setActiveView] = useState("tasks");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(EMPTY_ADMIN_DATA);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

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

  function getRequestErrorMessage(error, fallbackMessage) {
    const backendMessage = error?.response?.data?.message;

    if (backendMessage) {
      return backendMessage;
    }

    return fallbackMessage;
  }

  function getAuthConfig(jwt = token) {
    return {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    };
  }

  function isUnauthorizedError(error) {
    return error?.response?.status === 401;
  }

  function isSessionAuthError(error) {
    const status = error?.response?.status;
    return status === 401 || status === 403;
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
      await axios.get(`${API_URL}/admin/stats`, getAuthConfig(jwt));
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

      const response = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        params,
      });

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
        axios.get(`${API_URL}/admin/stats`, getAuthConfig(jwt)),
        axios.get(`${API_URL}/admin/users`, getAuthConfig(jwt)),
        axios.get(`${API_URL}/admin/tasks`, getAuthConfig(jwt)),
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
      await axios.delete(`${API_URL}/telegram/disconnect`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      await axios.patch(
          `${API_URL}/tasks/${taskId}/reminder`,
          { reminderAt: reminderDate.toISOString() },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

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
      await axios.delete(
          `${API_URL}/tasks/${taskId}/reminder`,
          getAuthConfig()
      );

      await fetchTasks();
      await fetchAllTasks();

      setReminderInputs((prevInputs) => {
        const nextInputs = { ...prevInputs };
        delete nextInputs[taskId];
        return nextInputs;
      });

      setOpenReminderTaskId(null);
      setHiddenReminderTaskIds((currentIds) =>
          currentIds.filter((currentTaskId) => currentTaskId !== taskId)
      );

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
    setHiddenReminderTaskIds((currentIds) =>
      currentIds.filter((currentTaskId) => currentTaskId !== taskId)
    );
    setOpenReminderTaskId(taskId);
    setOpenTaskMenuId(null);
  }

  function hideReminderPanel(taskId) {
    setHiddenReminderTaskIds((currentIds) =>
      currentIds.includes(taskId) ? currentIds : [...currentIds, taskId]
    );
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
    setHiddenReminderTaskIds([]);
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

  function formatOptionalDate(dateValue) {
    return dateValue ? formatTaskDate(dateValue) : "—";
  }

  function formatTelegramUsername(username) {
    if (!username) {
      return "—";
    }

    return username.startsWith("@") ? username : `@${username}`;
  }

  function getRecentAdminTasks() {
    return [...adminData.tasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);
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
                      activeView === "tasks" && selectedStatus === status.value
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

          {isAdmin && (
              <div className="sidebar-section">
                <p className="section-title">Admin</p>

                <button
                    type="button"
                    className={activeView === "admin" ? "admin-panel-button active" : "admin-panel-button"}
                    onClick={openAdminPanel}
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

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="main">
          <header className="main-header">
            <div>
              <h1>
                {activeView === "admin"
                    ? "Admin Panel"
                    : selectedStatus
                      ? selectedStatus.replace("_", " ")
                      : "All tasks"}
              </h1>
              <p>
                {activeView === "admin"
                    ? "Read-only overview of users, tasks and Telegram links"
                    : `${tasks.length} task${tasks.length === 1 ? "" : "s"} loaded`}
              </p>
            </div>
          </header>

          {message && (
              <div className={`message-banner ${messageType}`}>
                {message}
              </div>
          )}

          {activeView === "admin" ? (
              <section className="admin-dashboard">
                <div className="admin-toolbar">
                  <div>
                    <h2>System overview</h2>
                    <p>Protected by backend <code>/admin/**</code> role checks.</p>
                  </div>

                  <button
                      type="button"
                      onClick={() => fetchAdminData(token)}
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
          ) : (
              <>
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
                          {task.pinned && (
                              <span className="pinned-badge" title="Pinned task">
                                <PinIcon filled />
                              </span>
                          )}

                          <div className="task-menu-wrapper">
                            <button
                                type="button"
                                className={openTaskMenuId === task.id ? "task-menu-button active" : "task-menu-button"}
                                onClick={() => toggleTaskMenu(task.id)}
                                aria-label="Open task actions"
                                aria-expanded={openTaskMenuId === task.id}
                            >
                              ⋯
                            </button>

                            {openTaskMenuId === task.id && (
                                <div className="task-actions-menu">
                                  <button
                                      type="button"
                                      onClick={() => {
                                        togglePinTask(task.id);
                                        closeTaskMenu();
                                      }}
                                  >
                                    {task.pinned ? "Unpin" : "Pin"}
                                  </button>

                                  <button
                                      type="button"
                                      onClick={() => {
                                        updateTaskStatus(task.id, "TODO");
                                        closeTaskMenu();
                                      }}
                                  >
                                    Move to TODO
                                  </button>

                                  <button
                                      type="button"
                                      onClick={() => {
                                        updateTaskStatus(task.id, "IN_PROGRESS");
                                        closeTaskMenu();
                                      }}
                                  >
                                    Move to Progress
                                  </button>

                                  <button
                                      type="button"
                                      onClick={() => {
                                        updateTaskStatus(task.id, "DONE");
                                        closeTaskMenu();
                                      }}
                                  >
                                    Move to Done
                                  </button>

                                  <button
                                      type="button"
                                      onClick={() => openReminderForTask(task.id)}
                                  >
                                    Set reminder
                                  </button>

                                  <button
                                      type="button"
                                      onClick={() => startEdit(task)}
                                  >
                                    Edit
                                  </button>

                                  <button
                                      type="button"
                                      className="danger-menu-item"
                                      onClick={() => {
                                        setTaskIdToDelete(task.id);
                                        closeTaskMenu();
                                      }}
                                  >
                                    Delete
                                  </button>
                                </div>
                            )}
                          </div>
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
                              <span>Created: {formatTaskDate(task.createdAt)}</span>
                              {task.reminderAt && (
                                  <span>Reminder: {formatTaskDate(task.reminderAt)}</span>
                              )}
                              {task.reminderSent && <span className="sent-meta">Reminder sent</span>}
                            </div>

                            {(openReminderTaskId === task.id ||
                                (task.reminderAt && !hiddenReminderTaskIds.includes(task.id))) && (
                                <div className="task-reminder-panel">
                                  <div className="task-reminder-meta">
                                    <div className="task-reminder-meta-text">
                                      <span>Reminder</span>
                                      <strong>
                                        {task.reminderAt ? formatTaskDate(task.reminderAt) : "Not set"}
                                      </strong>
                                      {task.reminderSent && <em>Sent</em>}
                                    </div>

                                    <button
                                        type="button"
                                        className="reminder-panel-close"
                                        onClick={() => hideReminderPanel(task.id)}
                                        aria-label="Hide reminder panel"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  <div className="task-reminder-controls">
                                    <label className="reminder-field reminder-date-field">
                                      <span>Date</span>
                                      <input
                                          type="date"
                                          value={getReminderInputValue(task).date}
                                          onChange={(e) => updateReminderInput(task.id, "date", e.target.value)}
                                          disabled={reminderLoadingTaskId === task.id}
                                      />
                                    </label>

                                    <label className="reminder-field reminder-time-field">
                                      <span>Time · 24h</span>
                                      <div className="reminder-time-inputs">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="2"
                                            placeholder="HH"
                                            value={getReminderInputValue(task).hour}
                                            onChange={(e) =>
                                              updateReminderInput(
                                                task.id,
                                                "hour",
                                                e.target.value.replace(/\D/g, "").slice(0, 2)
                                              )
                                            }
                                            disabled={reminderLoadingTaskId === task.id}
                                            aria-label="Reminder hour, 24-hour format"
                                        />

                                        <span aria-hidden="true">:</span>

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="2"
                                            placeholder="MM"
                                            value={getReminderInputValue(task).minute}
                                            onChange={(e) =>
                                              updateReminderInput(
                                                task.id,
                                                "minute",
                                                e.target.value.replace(/\D/g, "").slice(0, 2)
                                              )
                                            }
                                            disabled={reminderLoadingTaskId === task.id}
                                            aria-label="Reminder minute"
                                        />
                                      </div>
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setTaskReminder(task.id)}
                                        disabled={reminderLoadingTaskId === task.id}
                                    >
                                      {reminderLoadingTaskId === task.id ? "Saving..." : "Save reminder"}
                                    </button>

                                    {task.reminderAt && (
                                        <button
                                            type="button"
                                            className="reminder-delete-button"
                                            onClick={() => deleteTaskReminder(task.id)}
                                            disabled={reminderLoadingTaskId === task.id}
                                        >
                                          {reminderLoadingTaskId === task.id ? "Deleting..." : "Delete reminder"}
                                        </button>
                                    )}
                                  </div>

                                  {!telegramStatus.connected && (
                                      <p className="task-reminder-hint">
                                        Connect Telegram first to receive reminders.
                                      </p>
                                  )}
                                </div>
                            )}
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

              </>
          )}

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






