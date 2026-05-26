import { useEffect } from "react";
import {
  getRefreshToken,
  isAccessTokenExpiringSoon,
  getAccessToken,
  refreshSessionSilently,
} from "@/lib/api";

/** Proactive refresh while the tab is visible (access token is 8h server-side; refresh every 5 min if needed). */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keeps JWTs fresh while the user has the site open in a visible tab.
 * Refreshes on mount and on an interval when the access token is near expiry.
 */
export default function SessionKeepAlive() {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (!getRefreshToken()) return;
      const access = getAccessToken();
      if (!access || isAccessTokenExpiringSoon(access, 25 * 60 * 1000)) {
        void refreshSessionSilently();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
