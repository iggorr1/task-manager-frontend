import { formatTaskDate } from "../../utils/formatters";

function TelegramSettingsModal({
  telegramLink,
  telegramLoading,
  telegramStatus,
  onClose,
  onCreateLink,
  onDisconnect,
  onRefresh,
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="telegram-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="telegram-modal-header">
          <div>
            <h3 id="telegram-modal-title">Telegram Settings</h3>
            <p>Connect your Telegram chat to receive task reminders.</p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
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
              onClick={onCreateLink}
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
            onClick={onDisconnect}
            disabled={telegramLoading}
          >
            {telegramLoading ? "Disconnecting..." : "Disconnect Telegram"}
          </button>
        )}

        <button
          type="button"
          className="telegram-refresh-button"
          onClick={onRefresh}
          disabled={telegramLoading}
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}

export default TelegramSettingsModal;
