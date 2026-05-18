export const STATUSES = [
  { label: "All tasks", value: "" },
  { label: "TODO", value: "TODO" },
  { label: "IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "DONE", value: "DONE" },
];

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 255;
export const STATUS_STORAGE_KEY = "taskflow:selectedStatus";
export const SORT_STORAGE_KEY = "taskflow:sort";

export const EMPTY_TELEGRAM_STATUS = {
  connected: false,
  telegramUsername: null,
  connectedAt: null,
};

export const EMPTY_ADMIN_DATA = {
  stats: null,
  users: [],
  tasks: [],
};
