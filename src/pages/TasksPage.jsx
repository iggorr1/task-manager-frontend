import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from "../constants/taskFlow";
import PinIcon from "../components/icons/PinIcon";
import { formatTaskDate } from "../utils/formatters";

function TasksPage({
  editDescription,
  editTitle,
  editingTaskId,
  newDescription,
  newTitle,
  openReminderTaskId,
  openTaskMenuId,
  reminderLoadingTaskId,
  tasks,
  telegramConnected,
  cancelEdit,
  closeTaskMenu,
  createTask,
  deleteTaskReminder,
  getReminderInputValue,
  hideReminderPanel,
  openReminderForTask,
  saveEdit,
  setEditDescription,
  setEditTitle,
  setNewDescription,
  setNewTitle,
  setTaskIdToDelete,
  setTaskReminder,
  startEdit,
  togglePinTask,
  toggleTaskMenu,
  updateReminderInput,
  updateTaskStatus,
}) {
  return (
    <>
      <section className="create-panel">
        <form onSubmit={createTask}>
          <input
            type="text"
            placeholder="New task title"
            value={newTitle}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(event) => setNewTitle(event.target.value)}
          />

          <input
            type="text"
            placeholder="Description"
            value={newDescription}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChange={(event) => setNewDescription(event.target.value)}
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
                    onChange={(event) => setEditTitle(event.target.value)}
                  />

                  <input
                    type="text"
                    value={editDescription}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    onChange={(event) => setEditDescription(event.target.value)}
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

                  {openReminderTaskId === task.id && (
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
                            onChange={(event) => updateReminderInput(task.id, "date", event.target.value)}
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
                              onChange={(event) =>
                                updateReminderInput(
                                  task.id,
                                  "hour",
                                  event.target.value.replace(/\D/g, "").slice(0, 2)
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
                              onChange={(event) =>
                                updateReminderInput(
                                  task.id,
                                  "minute",
                                  event.target.value.replace(/\D/g, "").slice(0, 2)
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

                      {!telegramConnected && (
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
  );
}

export default TasksPage;
