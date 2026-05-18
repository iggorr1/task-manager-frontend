function DeleteTaskModal({ onCancel, onConfirm }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="delete-modal-title">Delete task?</h3>
        <p>This action cannot be undone.</p>

        <div className="delete-modal-actions">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTaskModal;
