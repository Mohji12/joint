import { useState, useEffect } from "react";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearSessionClient,
  CURRENT_USER_STORAGE_KEY,
  getMe,
  refreshSessionSilently,
  isAccessTokenExpiringSoon,
  type TokenResponse,
  type ApiUser,
} from "@/lib/api";

/** App-facing user shape (id, name, email, userType, mobile/avatar when available) */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: "builder" | "landowner" | "admin";
  mobile?: string;
  avatarUrl?: string;
}

function normalizeUser(apiUser: ApiUser): AuthUser {
  const userType: AuthUser["userType"] =
    apiUser.role === "ADMIN"
      ? "admin"
      : apiUser.role === "PROFESSIONAL"
        ? "builder"
        : "landowner";
  return {
    id: String(apiUser.id),
    name: apiUser.name ?? apiUser.email,
    email: apiUser.email,
    userType,
    mobile: (apiUser as { phone?: string }).phone,
    avatarUrl: apiUser.avatar_url,
  };
}

function readCachedUser(): AuthUser | null {
  const userData = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyAuthFromStorage = () => {
      const token = getAccessToken();
      const cachedUser = readCachedUser();

      if (token && cachedUser) {
        setIsAuthenticated(true);
        setUser(cachedUser);
        return;
      }

      if (!token && getRefreshToken() && cachedUser) {
        // Access missing but refresh + user exist — stay authenticated until refresh resolves.
        setIsAuthenticated(true);
        setUser(cachedUser);
        return;
      }

      if (!token && (cachedUser || getRefreshToken())) {
        clearSessionClient();
      }
      setIsAuthenticated(false);
      setUser(null);
    };

    const bootstrap = async () => {
      const refresh = getRefreshToken();
      let access = getAccessToken();

      if (refresh && (!access || isAccessTokenExpiringSoon(access, 20 * 60 * 1000))) {
        await refreshSessionSilently();
        if (cancelled) return;
        access = getAccessToken();
      }

      applyAuthFromStorage();
      if (!cancelled) setLoading(false);
    };

    void bootstrap();

    const onSessionCleared = () => {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    };

    const onStorage = () => {
      applyAuthFromStorage();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("jointlly-auth-cleared", onSessionCleared);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jointlly-auth-cleared", onSessionCleared);
    };
  }, []);

  /** Persist auth state from API token response (after login/register). */
  const login = (response: TokenResponse) => {
    setTokens(response.access_token, response.refresh_token);
    const normalized = normalizeUser(response.user);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalized));
    setIsAuthenticated(true);
    setUser(normalized);
  };

  const logout = () => {
    clearSessionClient();
    setIsAuthenticated(false);
    setUser(null);
  };

  /** Refetch current user from API and update state (e.g. after profile photo upload). */
  const refreshUser = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const apiUser = await getMe();
      const normalized = normalizeUser(apiUser);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(normalized));
      setUser(normalized);
    } catch {
      // Keep existing user on error
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refreshUser,
  };
};
