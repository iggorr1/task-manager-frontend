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

export default PinIcon;
