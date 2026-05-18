export function formatTaskDate(dateValue) {
  if (!dateValue) {
    return "No date";
  }

  return new Date(dateValue).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOptionalDate(dateValue) {
  return dateValue ? formatTaskDate(dateValue) : "—";
}

export function formatTelegramUsername(username) {
  if (!username) {
    return "—";
  }

  return username.startsWith("@") ? username : `@${username}`;
}
