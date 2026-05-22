import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript() {
  const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

  if (existingScript) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function TurnstileWidget({ refreshKey, siteKey, onExpire, onVerify }) {
  const containerRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  const onVerifyRef = useRef(onVerify);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    onExpireRef.current = onExpire;
    onVerifyRef.current = onVerify;
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return undefined;
    }

    let isMounted = true;

    loadTurnstileScript()
      .then(() => {
        if (!isMounted || !window.turnstile || !containerRef.current) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current(),
          "error-callback": () => onExpireRef.current(),
          theme: "auto",
        });
      })
      .catch(() => {
        onExpireRef.current();
      });

    return () => {
      isMounted = false;

      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [refreshKey, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div className="turnstile-widget" ref={containerRef} />;
}

export default TurnstileWidget;
