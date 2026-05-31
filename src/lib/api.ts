/**
 * API client for Jointlly backend.
 * Base URL from VITE_API_URL (falls back to local backend if unset).
 */

const DEFAULT_API_URL =
  "http://127.0.0.1:8001";

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  if (typeof url === "string" && url) return url.replace(/\/$/, "");
  return DEFAULT_API_URL;
};

const API_STORAGE_SCOPE = getBaseUrl()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

const TOKEN_KEYS = {
  access: `access_token__${API_STORAGE_SCOPE}`,
  refresh: `refresh_token__${API_STORAGE_SCOPE}`,
} as const;

const LEGACY_TOKEN_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
} as const;

export type BackendRole = "LANDOWNER" | "PROFESSIONAL" | "ADMIN";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: BackendRole;
  is_active: boolean;
  created_at: string;
  phone?: string;
  avatar_url?: string;
}

export interface RegisterResponse {
  message: string;
  requires_verification: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: ApiUser;
}

export interface MessageResponse {
  message: string;
}

// ----- Support chatbot (no LLM) -----
export type SupportAudienceRole = "builder" | "landowner" | "admin" | "all";

export interface SupportChip {
  label: string;
  action: Record<string, unknown>;
}

export interface SupportArticle {
  id: string;
  title: string;
  slug: string;
  audience: string;
  category: string;
  keywords: string[];
  content_md: string;
}

export interface SupportFlowOption {
  id: string;
  label: string;
  action: Record<string, unknown>;
}

export interface SupportFlowPayload {
  flowId: string;
  nodeId: string;
  prompt: string;
  options: SupportFlowOption[];
}

export interface SupportChatRequest {
  message: string;
  sessionId?: string | null;
  route?: string | null;
  role?: SupportAudienceRole | null;
  context?: Record<string, unknown>;
}

export interface SupportChatResponse {
  message: string;
  chips: SupportChip[];
  articles: SupportArticle[];
  flow?: SupportFlowPayload | null;
  escalation?: { canCreateTicket: boolean } | null;
}

export interface SupportSuggestionsResponse {
  chips: SupportChip[];
}

export interface SupportTicketCreateRequest {
  subject: string;
  description?: string;
  route?: string | null;
  role?: SupportAudienceRole | null;
  metadata?: Record<string, unknown>;
}

export interface SupportTicketCreateResponse {
  ticketId: string;
  status: string;
}

export async function supportChat(body: SupportChatRequest): Promise<SupportChatResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/support/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  return handleResponse<SupportChatResponse>(res);
}

export async function supportSuggestions(params?: {
  route?: string;
  role?: SupportAudienceRole;
}): Promise<SupportSuggestionsResponse> {
  const base = getBaseUrl();
  const qs = new URLSearchParams();
  if (params?.route) qs.set("route", params.route);
  if (params?.role) qs.set("role", params.role);
  const url = `${base}/api/v1/support/suggestions${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await authFetch(url, { method: "GET", headers: { ...authHeader() } });
  return handleResponse<SupportSuggestionsResponse>(res);
}

export async function createSupportTicket(
  body: SupportTicketCreateRequest
): Promise<SupportTicketCreateResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/support/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body),
  });
  return handleResponse<SupportTicketCreateResponse>(res);
}

export interface VerifyEmailResponse {
  message: string;
  already_verified: boolean;
}

export interface VerifyOtpResponse {
  message: string;
  already_verified: boolean;
}

/** Same key as useAuth uses for cached profile (keep in sync). */
export const CURRENT_USER_STORAGE_KEY = `currentUser__${API_STORAGE_SCOPE}`;
const LEGACY_CURRENT_USER_STORAGE_KEY = "currentUser";
const AUTH_STORAGE_MIGRATION_KEY = `auth_storage_migrated__${API_STORAGE_SCOPE}`;

function migrateLegacyAuthStorage(): void {
  try {
    // Run once per API scope to avoid repeated storage churn.
    if (localStorage.getItem(AUTH_STORAGE_MIGRATION_KEY) === "1") return;

    const scopedAccess = localStorage.getItem(TOKEN_KEYS.access);
    const scopedRefresh = localStorage.getItem(TOKEN_KEYS.refresh);
    const scopedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);

    if (!scopedAccess && !scopedRefresh && !scopedUser) {
      const legacyAccess = localStorage.getItem(LEGACY_TOKEN_KEYS.access);
      const legacyRefresh = localStorage.getItem(LEGACY_TOKEN_KEYS.refresh);
      const legacyUser = localStorage.getItem(LEGACY_CURRENT_USER_STORAGE_KEY);

      if (legacyAccess) localStorage.setItem(TOKEN_KEYS.access, legacyAccess);
      if (legacyRefresh) localStorage.setItem(TOKEN_KEYS.refresh, legacyRefresh);
      if (legacyUser) localStorage.setItem(CURRENT_USER_STORAGE_KEY, legacyUser);
    }

    // Always clear legacy keys after migration to avoid cross-backend token confusion.
    localStorage.removeItem(LEGACY_TOKEN_KEYS.access);
    localStorage.removeItem(LEGACY_TOKEN_KEYS.refresh);
    localStorage.removeItem(LEGACY_CURRENT_USER_STORAGE_KEY);
    localStorage.setItem(AUTH_STORAGE_MIGRATION_KEY, "1");
  } catch {
    /* ignore storage errors */
  }
}

/** Decode JWT exp (ms since epoch). Returns null if unreadable. */
export function getAccessTokenExpiresAtMs(accessToken: string): number | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    let base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when access token is expired or within `withinMs` of expiry. Unknown exp → not treated as expired. */
export function isAccessTokenExpiringSoon(
  accessToken: string | null,
  withinMs = 20 * 60 * 1000,
): boolean {
  if (!accessToken) return true;
  const exp = getAccessTokenExpiresAtMs(accessToken);
  if (!exp) return false;
  return Date.now() >= exp - withinMs;
}

/** Get stored access token for auth header */
export function getAccessToken(): string | null {
  migrateLegacyAuthStorage();
  return localStorage.getItem(TOKEN_KEYS.access);
}

/** Get stored refresh token */
export function getRefreshToken(): string | null {
  migrateLegacyAuthStorage();
  return localStorage.getItem(TOKEN_KEYS.refresh);
}

/** Store tokens in localStorage (call after login/register success) */
export function setTokens(access: string, refresh: string): void {
  migrateLegacyAuthStorage();
  localStorage.setItem(TOKEN_KEYS.access, access);
  localStorage.setItem(TOKEN_KEYS.refresh, refresh);
}

/** Clear tokens from localStorage (call on logout) */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  // Clear old non-scoped keys too, if they still exist.
  localStorage.removeItem(LEGACY_TOKEN_KEYS.access);
  localStorage.removeItem(LEGACY_TOKEN_KEYS.refresh);
}

/**
 * Clear tokens + cached user and notify the app (same-tab logout).
 * Call when refresh fails (401/403) or tokens are invalid for the current API (e.g. switched backend URL).
 */
export function clearSessionClient(): void {
  migrateLegacyAuthStorage();
  clearTokens();
  try {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CURRENT_USER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("jointlly-auth-cleared"));
  }
}

/** Build Authorization header value for authenticated requests */
export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "detail" in data)
        ? (Array.isArray((data as { detail: unknown }).detail)
            ? (data as { detail: unknown[] }).detail.map((d: unknown) => String(d)).join(", ")
            : String((data as { detail: unknown }).detail))
        : res.statusText || "Request failed";
    if (import.meta.env.DEV) console.warn("[API] Error", res.status, res.url, data);
    throw new Error(message);
  }

  return data as T;
}

/**
 * True when GET /professionals/profile returns 404 — no row for this builder account yet
 * (e.g. new deploy / empty DB, or account never completed profile).
 */
export function isProfessionalProfileNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (/professionalprofile with id .+ not found/i.test(msg)) return true;
  if (/no professional profile found for this account/i.test(msg)) return true;
  if (/no professional profile found/i.test(msg)) return true;
  return false;
}

const isDev = import.meta.env.DEV;

export type LoginAccountType = "builder" | "landowner";

function isPathAllowedForRole(from: string, role: BackendRole): boolean {
  const path = from.split("?")[0];
  if (role === "ADMIN") return path === "/admin" || path.startsWith("/admin/");
  if (role === "PROFESSIONAL") return path === "/builder" || path.startsWith("/builder/");
  return path === "/landowner" || path.startsWith("/landowner/");
}

function postLoginRedirectPath(
  role: BackendRole,
  from?: string,
): string {
  if (from && isPathAllowedForRole(from, role)) return from;
  if (role === "ADMIN") return "/admin";
  if (role === "PROFESSIONAL") return "/builder/options";
  return "/landowner/options";
}

export type AppUserType = "builder" | "landowner" | "admin";

export function dashboardPathForUserType(userType: AppUserType): string {
  if (userType === "admin") return "/admin";
  if (userType === "landowner") return "/landowner/dashboard";
  return "/builder/dashboard";
}

export function optionsPathForUserType(userType: AppUserType): string {
  if (userType === "admin") return "/admin";
  if (userType === "landowner") return "/landowner/options";
  return "/builder/options";
}

export { postLoginRedirectPath };

/**
 * Login with email and password.
 * Body: application/x-www-form-urlencoded (OAuth2 style).
 * accountType must match the user's registered role (builder → PROFESSIONAL, landowner → LANDOWNER).
 */
export async function login(
  email: string,
  password: string,
  accountType?: LoginAccountType,
): Promise<TokenResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/login`;
  const bodyParams: Record<string, string> = {
    username: email,
    password,
  };
  if (accountType) bodyParams.account_type = accountType;
  const body = new URLSearchParams(bodyParams).toString();

  if (isDev) console.log("[API] POST", url, { username: email, account_type: accountType ?? "(none)" });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await handleResponse<TokenResponse>(res);
  if (isDev) console.log("[API] Login response:", res.status, data);
  return data;
}

/**
 * Register a new user.
 * Body: JSON with name, email, password, role (LANDOWNER | PROFESSIONAL).
 */
export async function register(
  name: string,
  email: string,
  phone: string,
  password: string,
  role: BackendRole
): Promise<RegisterResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/register`;
  const body = JSON.stringify({ name, email, phone, password, role });

  if (isDev) console.log("[API] POST", url, { name, email, phone, role });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await handleResponse<RegisterResponse>(res);
  if (isDev) console.log("[API] Register response:", res.status, data);
  return data;
}

/**
 * Get current user (requires valid access token).
 */
export async function getMe(): Promise<ApiUser> {
  const base = getBaseUrl();
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await authFetch(`${base}/api/v1/auth/me`, {
    method: "GET",
    headers: { ...authHeader() },
  });

  return handleResponse<ApiUser>(res);
}

/** Update current user profile (avatar URL, name, phone). Returns updated user. */
export interface UpdateProfilePayload {
  avatar_url?: string;
  name?: string;
  phone?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ApiUser> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse<ApiUser>(res);
}

/** Mirrors backend TransactionType enum */
export type ApiTransactionType =
  | "PID_VERIFICATION"
  | "FEASIBILITY_UNLOCK"
  | "PRIORITY_LISTING"
  | "LANDOWNER_ENTRY"
  | "BUILDER_ENTRY_INTERIORS"
  | "BUILDER_ENTRY_RECONSTRUCTION"
  | "BUILDER_ENTRY_CONSTRUCTION"
  | "BUILDER_ENTRY_JD"
  | "SUCCESS_FEE_BUILDER"
  | "SUCCESS_FEE_LANDOWNER"
  | "BUILDER_MATCH_SELECTION";

/** Mirrors backend TransactionStatus enum */
export type ApiTransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentTransaction {
  id: string;
  user_id: string;
  project_id: string | null;
  match_id: string | null;
  transaction_type: ApiTransactionType;
  amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: ApiTransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderPayload {
  amount: number;
  transaction_type: ApiTransactionType;
  project_id?: string;
  match_id?: string;
  currency?: string;
}

export interface CreateOrderResult {
  transaction_id: string;
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
}

/** Current user's payment / transaction history (auth required). */
export async function getMyTransactions(): Promise<PaymentTransaction[]> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/payments/transactions`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  return handleResponse<PaymentTransaction[]>(res);
}

/** Create a payment order (Razorpay) for a transaction type. */
export async function createPaymentOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse<CreateOrderResult>(res);
}

/**
 * Refresh access token using refresh_token.
 * Does not clear the session on failure — users stay signed in until they log out or close the tab;
 * API calls may still return 401 until refresh succeeds (e.g. next interval or retry).
 */
export async function refreshToken(): Promise<TokenResponse> {
  const base = getBaseUrl();
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(`${base}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "detail" in data
        ? Array.isArray((data as { detail: unknown }).detail)
          ? (data as { detail: unknown[] }).detail.map((d: unknown) => String(d)).join(", ")
          : String((data as { detail: unknown }).detail)
        : res.statusText || "Request failed";
    throw new Error(message);
  }

  const tokenData = data as TokenResponse;
  setTokens(tokenData.access_token, tokenData.refresh_token);
  return tokenData;
}

/** Coalesce parallel 401→refresh so we only hit /auth/refresh once */
let refreshAccessInFlight: Promise<boolean> | null = null;

async function refreshAccessTokenOnce(): Promise<boolean> {
  if (refreshAccessInFlight) return refreshAccessInFlight;
  refreshAccessInFlight = (async () => {
    try {
      if (!getRefreshToken()) return false;
      await refreshToken();
      return true;
    } catch {
      return false;
    } finally {
      refreshAccessInFlight = null;
    }
  })();
  return refreshAccessInFlight;
}

/**
 * Silently refresh access + refresh tokens when the tab is active.
 * Call on an interval so sessions stay valid while the user keeps the site open.
 */
export async function refreshSessionSilently(): Promise<boolean> {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (!refresh) return false;
  // Skip network call if access token is still fresh (>20 min left).
  if (access && !isAccessTokenExpiringSoon(access, 20 * 60 * 1000)) {
    return true;
  }
  return refreshAccessTokenOnce();
}

/**
 * Adds Authorization; on 401 with a refresh token, refreshes once and retries.
 * Do not use for /auth/login, /auth/register, or /auth/refresh.
 */
async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const mergeAuth = (): Headers => {
    const h = new Headers(init.headers as HeadersInit);
    for (const [k, v] of Object.entries(authHeader())) {
      if (v) h.set(k, v);
    }
    return h;
  };

  let res = await fetch(input, { ...init, headers: mergeAuth() });
  if (res.status === 401 && getRefreshToken()) {
    const ok = await refreshAccessTokenOnce();
    if (ok) {
      res = await fetch(input, { ...init, headers: mergeAuth() });
    }
  }
  return res;
}

/**
 * Request a password reset link to be sent to the given email address.
 * Always returns a generic message regardless of whether the email exists.
 */
export async function requestPasswordReset(email: string): Promise<MessageResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/forgot-password`;

  if (isDev) console.log("[API] POST", url, { email });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return handleResponse<MessageResponse>(res);
}

/**
 * Complete password reset with OTP (email + otp + new password).
 */
export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string
): Promise<MessageResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/reset-password`;

  if (isDev) console.log("[API] POST", url, { email });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  });

  return handleResponse<MessageResponse>(res);
}

/**
 * Complete password reset with legacy reset token and new password.
 */
export async function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/reset-password`;

  if (isDev) console.log("[API] POST", url, { token });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  return handleResponse<MessageResponse>(res);
}

/**
 * Verify a user's email using a token from the verification link.
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/verify-email`;

  if (isDev) console.log("[API] POST", url, { token });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  return handleResponse<VerifyEmailResponse>(res);
}

/**
 * Verify a user's email using an OTP sent via email.
 */
export async function verifyEmailOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/verify-otp`;

  if (isDev) console.log("[API] POST", url, { email });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  return handleResponse<VerifyOtpResponse>(res);
}

/**
 * Resend verification OTP to a user's email.
 */
export async function resendEmailOtp(email: string): Promise<MessageResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/auth/resend-otp`;

  if (isDev) console.log("[API] POST", url, { email });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return handleResponse<MessageResponse>(res);
}

// ----- Uploads (S3 presigned URLs) -----
export interface PresignResponse {
  upload_url: string;
  key: string;
  public_url: string;
}

/** Get presigned URL for uploading a file to S3. Requires auth. */
export async function getPresignedUploadUrl(
  filename: string,
  content_type = "image/jpeg",
  prefix = "uploads"
): Promise<PresignResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ filename, content_type, prefix }),
  });
  return handleResponse<PresignResponse>(res);
}

/** Upload a file to S3 using a presigned URL. */
export async function uploadFileToS3(
  file: File,
  uploadUrl: string,
  contentType: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
}

/** Upload file to Cloudinary via backend and return its public URL. Requires auth. */
export async function uploadFileAndGetUrl(file: File, prefix = "uploads"): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error("Login required to upload files");
  const base = getBaseUrl();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", prefix);
  const res = await authFetch(`${base}/api/v1/uploads/upload`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  const data = await handleResponse<{ public_url: string }>(res);
  return data.public_url;
}

// ----- Form submissions -----
export interface FormSubmissionResponse {
  id: string;
  form_type: string;
  side: string;
  message?: string;
}

export interface FormSubmissionDetail {
  id: string;
  form_type: string;
  side: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Latest saved builder marketplace forms (one entry per type when submitted). */
export interface BuilderPortfolioLatest {
  contract_construction: FormSubmissionDetail | null;
  joint_venture: FormSubmissionDetail | null;
  interior: FormSubmissionDetail | null;
  renovation_repaint: FormSubmissionDetail | null;
}

// ----- FAR calculation -----

export type FARUseType = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL";

export type FARZone =
  | "NORTH_BBMP"
  | "SOUTH_BBMP"
  | "EAST_BBMP"
  | "WEST_BBMP"
  | "BDA_RR"
  | "KIADB_INDUSTRIAL";

/** Six zone options for FAR: North, South, East, West Bengaluru, Central Bengaluru, KIADB. */
export const FAR_ZONE_OPTIONS: { value: FARZone; label: string }[] = [
  { value: "NORTH_BBMP", label: "North Bengaluru" },
  { value: "SOUTH_BBMP", label: "South Bengaluru" },
  { value: "EAST_BBMP", label: "East Bengaluru" },
  { value: "WEST_BBMP", label: "West Bengaluru" },
  { value: "BDA_RR", label: "Central Bengaluru" },
  { value: "KIADB_INDUSTRIAL", label: "KIADB" },
];

export type FARPremiumBand = "LOW" | "MEDIUM" | "HIGH";

export interface FARRuleInput {
  plot_length_ft?: number;
  plot_width_ft?: number;
  plot_area_sqft?: number;
  road_width_ft: number;
  zone?: FARZone;
  use_type: FARUseType;
  premium_far_opt_in?: boolean;
  premium_far_band?: FARPremiumBand;
  rules_year?: number;
}

export interface FARSetbackResult {
  front_setback_m: number;
  rear_setback_m: number;
  side_setback_m: number;
  coverage_percent: number;
  plot_category: string;
}

export interface FARResult {
  base_far: number;
  premium_far_increment: number;
  effective_far: number;
  min_far_allowed: number;
  max_far_allowed: number;
  plot_area_sqft: number;
  road_width_ft: number;
  total_buildable_area_sqft: number;
  floors_allowed?: string;
  use_type: string;
  zone?: string;
  premium_far_opt_in: boolean;
  setbacks?: FARSetbackResult;
  rules_version: string;
  notes?: string;
}

/** Builder JV form payload (snake_case for API). */
export interface BuilderJointVenturePayload {
  company_name: string;
  years_experience: string;
  entity_type?: string;
  builder_license?: string;
  rera_registration?: string;
  gst_number?: string;
  address: string;
  project_caps: string[];
  preferred_locations?: string;
  projects_completed?: string;
  rera_yes_no?: string;
  rera_projects?: string;
  project_scale?: string;
  team_size?: string;
  jv_arrangements: string[];
  location1?: string;
  radius1?: string;
  location2?: string;
  radius2?: string;
  location3?: string;
  radius3?: string;
  recent_projects: Array<{
    name_location: string;
    built_up_sft: string;
    type: string;
    duration_months: string;
    image_urls: string[];
  }>;
  /** Nested: residential/commercial/industrial -> package id -> field key -> value */
  pricing?: Record<string, unknown>;
}

export async function submitBuilderJointVenture(
  data: BuilderJointVenturePayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/joint-venture`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Builder contract construction form payload. */
export interface BuilderContractConstructionPayload {
  company_name: string;
  years_experience: string;
  license_rera?: string;
  address: string;
  project_types: string[];
  preferred_location?: string;
  projects_completed?: string;
  project_details?: string;
  team_type?: string;
  subcontractor_scopes?: string[];
  subcontractor_other?: string;
  typical_size?: string;
  typical_size_other?: string;
  /** Nested: residential/commercial/industrial -> package id -> field key -> value */
  pricing?: Record<string, unknown>;
  project_image_urls: string[];
  /** Up to 3 recent projects with 3 images + 1 video each */
  recent_projects?: Array<{
    name_location?: string;
    built_up_sft?: string;
    type?: string;
    duration_months?: string;
    image_urls?: string[];
    video_url?: string;
  }>;
}

export async function submitBuilderContractConstruction(
  data: BuilderContractConstructionPayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/contract-construction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

export async function getLatestBuilderContractConstructionForm(): Promise<FormSubmissionDetail | null> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/contract-construction/latest`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  return handleResponse<FormSubmissionDetail | null>(res);
}

export async function getBuilderPortfolioLatest(): Promise<BuilderPortfolioLatest> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/portfolio/latest`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  return handleResponse<BuilderPortfolioLatest>(res);
}

/** Landowner view: latest builder portfolio for a marketplace profile. */
export async function getBuilderMarketplacePortfolio(
  professionalId: string
): Promise<BuilderPortfolioLatest> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/marketplace/builders/${professionalId}/portfolio`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  return handleResponse<BuilderPortfolioLatest>(res);
}

/** Replace JSON payload for a builder form submission (portfolio edit). */
export async function patchBuilderFormSubmission(
  submissionId: string,
  payload: Record<string, unknown>
): Promise<FormSubmissionDetail> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/submissions/${submissionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ payload }),
  });
  return handleResponse<FormSubmissionDetail>(res);
}

/** Landowner JV form payload. */
/** POC (point of contact) when has_poc is true. */
export interface PointOfContactPayload {
  has_poc: true;
  name?: string;
  mobile?: string;
  availability?: string;
  timing?: string;
}

export interface LandownerJointVenturePayload {
  property_location?: Record<string, unknown>;
  property_details?: Record<string, unknown>;
  verification?: Record<string, unknown>;
  jv_preferences?: Record<string, unknown>;
  upsell?: Record<string, unknown>;
  feasibility?: Record<string, unknown>;
  point_of_contact?: { has_poc: false } | PointOfContactPayload;
  contract_preferences?: { construction_mode?: string };
}

export async function submitLandownerJointVenture(
  data: LandownerJointVenturePayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/landowner/joint-venture`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Landowner contract construction form payload. */
export interface LandownerContractConstructionPayload {
  landowner_name: string;
  property_location?: Record<string, unknown>;
  property_details?: Record<string, unknown>;
  far?: string;
  pid_validation?: Record<string, unknown> | null;
  project_intent?: Record<string, unknown>;
  point_of_contact?: { has_poc: false } | PointOfContactPayload;
  contract_preferences?: { construction_mode?: string };
}

export async function submitLandownerContractConstruction(
  data: LandownerContractConstructionPayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/landowner/contract-construction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Landowner interior form payload. */
export interface LandownerInteriorFormPayload {
  property_location?: { city?: string; ward?: string; landmark?: string; google_maps_location?: string };
  property_details?: Record<string, unknown>;
  project_scope?: Record<string, unknown>;
  timeline?: string;
  building_type?: string;
  location?: { address?: string; googleMapsLocation?: string };
  interior_preferences?: { space_type?: string; design_style?: string };
  point_of_contact?:
    | { has_poc?: false }
    | { has_poc: true; name?: string; mobile?: string; availability?: string; timing?: string };
  contract_preferences?: { construction_mode?: string };
}

export async function submitLandownerInteriorForm(
  data: LandownerInteriorFormPayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/landowner/interior`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Landowner reconstruction form payload. */
export interface LandownerReconstructionFormPayload {
  property_type?: Record<string, unknown>;
  location?: Record<string, unknown>;
  scope_of_work?: Record<string, unknown>;
  timeline?: string;
  contract_preferences?: { construction_mode?: string };
}

export async function submitLandownerReconstructionForm(
  data: LandownerReconstructionFormPayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/landowner/reconstruction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Builder interior form payload. */
export interface BuilderInteriorFormPayload {
  company_name?: string;
  years_experience?: string;
  address?: string;
  project_types?: string[];
  location?: Record<string, unknown>;
  project_scope?: Record<string, unknown>;
  recent_projects?: unknown[];
  pricing?: Record<string, unknown>;
}

export async function submitBuilderInteriorForm(
  data: BuilderInteriorFormPayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/interior`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Builder reconstruction form payload. */
export interface BuilderReconstructionFormPayload {
  company_name?: string;
  years_experience?: string;
  address?: string;
  project_caps?: string[];
  location?: Record<string, unknown>;
  scope_of_work?: Record<string, unknown>;
  work_types?: string[];
  pricing?: Record<string, unknown>;
  projects_completed?: string;
  recent_projects?: Array<{
    name_location?: string;
    built_up_sft?: string;
    type?: string;
    duration_months?: string;
    image_urls?: string[];
    video_url?: string;
  }>;
}

export async function submitBuilderReconstructionForm(
  data: BuilderReconstructionFormPayload
): Promise<FormSubmissionResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/forms/builder/reconstruction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<FormSubmissionResponse>(res);
}

/** Calculate FAR for a given plot using backend rules. */
export async function calculateFar(input: FARRuleInput): Promise<FARResult> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/far/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<FARResult>(res);
}

// ----- Plan image (OpenAI GPT + DALL·E) -----
export interface PlanImageSetbacks {
  front_setback_m: number;
  rear_setback_m: number;
  side_setback_m: number;
  coverage_percent: number;
}

export interface PlanImageRequest {
  plot_area_sqft: number;
  effective_far: number;
  total_buildable_area_sqft: number;
  floors_allowed?: string;
  use_type: FARUseType;
  setbacks?: PlanImageSetbacks;
  layout_preference?: string;
}

export interface PlanImageResponse {
  image_url: string;
}

/** Generate an indicative 2D plan image from FAR result (GPT + DALL·E). */
export async function generatePlanImage(params: PlanImageRequest): Promise<PlanImageResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/far/generate-plan-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return handleResponse<PlanImageResponse>(res);
}

// ----- Landowners (profile, properties, projects) -----

export interface LandownerProfileResponse {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandownerProfileCreate {
  name: string;
  phone?: string | null;
  city?: string | null;
}

export interface PropertyCreatePayload {
  name?: string | null;
  city: string;
  ward?: string | null;
  landmark?: string | null;
  google_maps_pin?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  width_ft?: number | null;
  length_ft?: number | null;
  facing?: string | null;
  is_corner_plot?: boolean;
  facings?: string[] | null;
  road_width_ft?: number | null;
  khatha_type?: string | null;
  e_khatha_status?: string | null;
  tax_paid?: boolean;
  pid_number?: string | null;
}

export interface PropertyResponse {
  id: string;
  landowner_id: string;
  name?: string | null;
  city: string;
  ward?: string | null;
  landmark?: string | null;
  google_maps_pin?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  width_ft?: number | null;
  length_ft?: number | null;
  facing?: string | null;
  is_corner_plot: boolean;
  facings?: string[] | null;
  road_width_ft?: number | null;
  khatha_type?: string | null;
  e_khatha_status?: string | null;
  tax_paid: boolean;
  pid_number?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectType =
  | "CONTRACT_CONSTRUCTION"
  | "JV_JD"
  | "INTERIOR"
  | "RECONSTRUCTION";
export type ProjectIntent = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL";
export type ProjectStatus = "DRAFT" | "PUBLISHED" | "MATCHED" | "COMPLETED";

export interface ProjectCreatePayload {
  property_id: string;
  project_type: ProjectType;
  intent?: ProjectIntent | null;
  asset_class?: string | null;
  budget_tier?: string | null;
  timeline?: string | null;
  scope?: string | null;
}

export interface ProjectResponse {
  id: string;
  property_id: string;
  project_type: ProjectType;
  intent?: ProjectIntent | null;
  asset_class?: string | null;
  budget_tier?: string | null;
  timeline?: string | null;
  scope?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export async function getLandownerProfile(): Promise<LandownerProfileResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/profile`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<LandownerProfileResponse>(res);
}

export async function createLandownerProfile(
  data: LandownerProfileCreate
): Promise<LandownerProfileResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<LandownerProfileResponse>(res);
}

export async function updateLandownerProfile(
  data: Partial<LandownerProfileCreate>
): Promise<LandownerProfileResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<LandownerProfileResponse>(res);
}

export async function listLandownerProperties(): Promise<PropertyResponse[]> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/properties`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<PropertyResponse[]>(res);
}

export async function createLandownerProperty(
  data: PropertyCreatePayload
): Promise<PropertyResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<PropertyResponse>(res);
}

export async function getLandownerProperty(
  propertyId: string
): Promise<PropertyResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/properties/${propertyId}`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<PropertyResponse>(res);
}

export async function listLandownerProjects(): Promise<ProjectResponse[]> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/projects`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<ProjectResponse[]>(res);
}

export async function createLandownerProject(
  data: ProjectCreatePayload
): Promise<ProjectResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<ProjectResponse>(res);
}

export async function getLandownerProject(
  projectId: string
): Promise<ProjectResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/landowners/projects/${projectId}`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<ProjectResponse>(res);
}

export async function publishLandownerProject(
  projectId: string
): Promise<ProjectResponse> {
  const base = getBaseUrl();
  const res = await authFetch(
    `${base}/api/v1/landowners/projects/${projectId}/publish`,
    { method: "POST", headers: authHeader() }
  );
  return handleResponse<ProjectResponse>(res);
}

// ----- Professionals (profile) -----

export interface ProfessionalProfileResponse {
  id: string;
  user_id: string;
  company_name: string;
  phone?: string | null;
  city?: string | null;
  experience_years?: number | null;
  rera_experience: boolean;
  wallet_size?: number | null;
  preferred_jv_model?: string | null;
  location_preferences?: string[] | null;
  workforce_capacity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalProfileCreate {
  company_name: string;
  phone?: string | null;
  city?: string | null;
  experience_years?: number | null;
  rera_experience?: boolean;
  wallet_size?: number | null;
  preferred_jv_model?: string | null;
  location_preferences?: string[] | null;
  workforce_capacity?: number | null;
}

export async function getProfessionalProfile(): Promise<ProfessionalProfileResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/professionals/profile`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<ProfessionalProfileResponse>(res);
}

export async function createProfessionalProfile(
  data: ProfessionalProfileCreate
): Promise<ProfessionalProfileResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/professionals/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<ProfessionalProfileResponse>(res);
}

export async function updateProfessionalProfile(
  data: Partial<ProfessionalProfileCreate>
): Promise<ProfessionalProfileResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/professionals/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data),
  });
  return handleResponse<ProfessionalProfileResponse>(res);
}

export type CapabilityType = "CONSTRUCTION" | "JV_JD" | "INTERIOR" | "RECONSTRUCTION";

export interface CapabilityResponse {
  id: string;
  professional_id: string;
  capability_type: CapabilityType;
  description?: string | null;
  created_at: string;
}

export async function listProfessionalCapabilities(): Promise<CapabilityResponse[]> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/professionals/capabilities`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<CapabilityResponse[]>(res);
}

/** Past work / showcase projects (portfolios table) — shown on Account → Projects */
export type ApiProjectType =
  | "CONTRACT_CONSTRUCTION"
  | "JV_JD"
  | "INTERIOR"
  | "RECONSTRUCTION";

export interface ProfessionalPortfolioItem {
  id: string;
  professional_id: string;
  project_name: string;
  project_type?: ApiProjectType | null;
  location?: string | null;
  area_sqft?: number | null;
  completion_date?: string | null;
  images?: string[] | null;
  description?: string | null;
  created_at: string;
}

export async function listProfessionalPortfolio(): Promise<ProfessionalPortfolioItem[]> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/professionals/portfolio`, {
    method: "GET",
    headers: authHeader(),
  });
  return handleResponse<ProfessionalPortfolioItem[]>(res);
}

export async function addProfessionalCapability(
  capability_type: CapabilityType,
  description?: string
): Promise<CapabilityResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/professionals/capabilities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ capability_type, description }),
  });
  return handleResponse<CapabilityResponse>(res);
}

// ----- Matching -----

export type MatchStatus =
  | "PENDING"
  | "LANDOWNER_SELECTED"
  | "BUILDER_SELECTED_PAID"
  | "CONNECTED"
  | "ACCEPTED"
  | "REJECTED";

export interface MatchResponse {
  id: string;
  project_id: string;
  professional_id: string;
  match_score: number;
  estimated_cost?: number | null;
  status: MatchStatus;
  express_interest_landowner: boolean;
  express_interest_builder: boolean;
  mutual_interest_at?: string | null;
  gatekeeper_unlocked_at?: string | null;
  t7_email_sent_at?: string | null;
  t30_email_sent_at?: string | null;
  deal_value?: number | null;
  deal_status?: string | null;
  success_fee_percent?: number | null;
  success_fee_amount_total?: number | null;
  success_fee_amount_builder?: number | null;
  success_fee_amount_landowner?: number | null;
  created_at: string;
  updated_at: string;
  match_score_details?: unknown;
}

export async function getProjectMatches(
  projectId: string,
  limit = 5
): Promise<MatchResponse[]> {
  const base = getBaseUrl();
  const res = await authFetch(
    `${base}/api/v1/matching/projects/${projectId}/matches?limit=${limit}`,
    { method: "GET", headers: authHeader() }
  );
  return handleResponse<MatchResponse[]>(res);
}

export async function getProfessionalMatches(
  professionalId: string,
  limit = 10
): Promise<MatchResponse[]> {
  const base = getBaseUrl();
  const res = await authFetch(
    `${base}/api/v1/matching/professionals/${professionalId}/projects?limit=${limit}`,
    { method: "GET", headers: authHeader() }
  );
  return handleResponse<MatchResponse[]>(res);
}

/** Create or fetch match for current builder + marketplace project. */
export async function ensureProjectMatch(projectId: string): Promise<MatchResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/matching/projects/${projectId}/ensure-match`, {
    method: "POST",
    headers: authHeader(),
  });
  return handleResponse<MatchResponse>(res);
}

export async function acceptMatch(matchId: string): Promise<MatchResponse> {
  const base = getBaseUrl();
  const res = await authFetch(
    `${base}/api/v1/matching/matches/${matchId}/accept`,
    { method: "POST", headers: authHeader() }
  );
  return handleResponse<MatchResponse>(res);
}

export async function rejectMatch(matchId: string): Promise<MatchResponse> {
  const base = getBaseUrl();
  const res = await authFetch(
    `${base}/api/v1/matching/matches/${matchId}/reject`,
    { method: "POST", headers: authHeader() }
  );
  return handleResponse<MatchResponse>(res);
}

export interface MatchConnectionEvent {
  match: MatchResponse;
  selection_side: "landowner" | "builder";
  payment_required: boolean;
  payment_status?: string | null;
  payment_transaction_id?: string | null;
  email_dispatched: boolean;
}

export interface BuilderSelectInitiateResponse {
  match: MatchResponse;
  transaction_id: string;
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id?: string | null;
}

export interface VerifyPaymentPayload {
  transaction_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function landownerSelectMatch(matchId: string): Promise<MatchConnectionEvent> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/matching/matches/${matchId}/landowner-select`, {
    method: "POST",
    headers: authHeader(),
  });
  return handleResponse<MatchConnectionEvent>(res);
}

/** Withdraw landowner selection so Select + confirm + email can be tested again. */
export async function landownerClearMatchSelection(matchId: string): Promise<MatchResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/matching/matches/${matchId}/landowner-clear-selection`, {
    method: "POST",
    headers: authHeader(),
  });
  return handleResponse<MatchResponse>(res);
}

export async function initiateBuilderSelect(matchId: string): Promise<BuilderSelectInitiateResponse> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/matching/matches/${matchId}/builder-select-initiate`, {
    method: "POST",
    headers: authHeader(),
  });
  return handleResponse<BuilderSelectInitiateResponse>(res);
}

export async function confirmBuilderSelect(
  matchId: string,
  transactionId: string
): Promise<MatchConnectionEvent> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/matching/matches/${matchId}/builder-select-confirmed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ transaction_id: transactionId }),
  });
  return handleResponse<MatchConnectionEvent>(res);
}

/** Dev/local: accept project without Razorpay when backend allows direct connect. */
export async function confirmBuilderSelectDirect(matchId: string): Promise<MatchConnectionEvent> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/matching/matches/${matchId}/builder-select-direct`, {
    method: "POST",
    headers: authHeader(),
  });
  return handleResponse<MatchConnectionEvent>(res);
}

export async function verifyPaymentTransaction(
  payload: VerifyPaymentPayload
): Promise<PaymentTransaction> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse<PaymentTransaction>(res);
}

// ----- Form → entity mapping (Option B: create real entities from form payloads) -----

/** Parse dimensions string like "30x40" to { width_ft, length_ft }. */
function parseDimensions(dimensions: string | undefined): {
  width_ft?: number;
  length_ft?: number;
} {
  if (!dimensions || typeof dimensions !== "string") return {};
  const parts = dimensions.split(/[x×]/i).map((d) => parseFloat(d.trim()));
  if (parts.length !== 2 || parts.some((v) => Number.isNaN(v))) return {};
  return { width_ft: parts[0], length_ft: parts[1] };
}

/** Landowner form payload (contract or JV) - common property fields. */
type LandownerFormPropertyLocation = {
  city?: string;
  ward?: string;
  landmark?: string;
  google_maps_location?: string;
};
type LandownerFormPropertyDetails = {
  dimensions?: string;
  facing?: string;
  is_corner_property?: boolean;
  corner_facings?: string;
  road_width?: string;
};

/**
 * Create Property and Project from landowner form payload (contract-construction or joint-venture).
 * Ensures landowner profile exists (creates with name if 404). Returns project_id and property_id.
 */
export async function createPropertyAndProjectFromLandownerForm(
  payload: {
    landowner_name?: string;
    property_location?: LandownerFormPropertyLocation;
    property_details?: LandownerFormPropertyDetails;
    verification?: { property_owner_name?: string; pid_number?: string; khatha_type?: string; ekhatha_status?: string; tax_paid_details?: string };
    project_intent?: { timeline?: string; category?: string; type?: string };
  },
  projectType: ProjectType,
  options?: { publish?: boolean }
): Promise<{ propertyId: string; projectId: string }> {
  const loc = payload.property_location || {};
  const details = payload.property_details || {};
  const city = loc.city || "Bangalore";
  const { width_ft, length_ft } = parseDimensions(details.dimensions);
  const roadWidthNum = details.road_width ? parseFloat(details.road_width) : undefined;

  let profile: LandownerProfileResponse;
  try {
    profile = await getLandownerProfile();
  } catch {
    const name =
      payload.landowner_name ||
      (payload as { verification?: { property_owner_name?: string } }).verification?.property_owner_name ||
      "Landowner";
    profile = await createLandownerProfile({ name, city });
  }

  const propertyPayload: PropertyCreatePayload = {
    city,
    ward: loc.ward || undefined,
    landmark: loc.landmark || undefined,
    google_maps_pin: loc.google_maps_location || undefined,
    width_ft: width_ft ?? undefined,
    length_ft: length_ft ?? undefined,
    facing: details.facing || undefined,
    is_corner_plot: details.is_corner_property ?? false,
    road_width_ft: roadWidthNum ?? undefined,
  };
  const verification = payload.verification;
  if (verification) {
    propertyPayload.pid_number = verification.pid_number || undefined;
    propertyPayload.khatha_type = verification.khatha_type || undefined;
    propertyPayload.e_khatha_status = verification.ekhatha_status || undefined;
  }

  const property = await createLandownerProperty(propertyPayload);

  const intentMap: Record<string, ProjectIntent> = {
    residential: "RESIDENTIAL",
    commercial: "COMMERCIAL",
    industrial: "INDUSTRIAL",
  };
  const projectIntent = payload.project_intent;
  const intent = projectIntent?.category
    ? intentMap[projectIntent.category] ?? undefined
    : undefined;
  const scope =
    projectIntent?.type || projectIntent?.timeline
      ? [projectIntent.type, projectIntent.timeline].filter(Boolean).join("; ")
      : undefined;

  const project = await createLandownerProject({
    property_id: property.id,
    project_type: projectType,
    intent: intent ?? undefined,
    timeline: projectIntent?.timeline ?? undefined,
    scope: scope || undefined,
  });

  if (options?.publish) {
    await publishLandownerProject(project.id);
  }
  return { propertyId: property.id, projectId: project.id };
}

/** Map form type to backend capability type for marketplace visibility */
export const FORM_TYPE_TO_CAPABILITY: Record<string, CapabilityType> = {
  "contract-construction": "CONSTRUCTION",
  "joint-venture": "JV_JD",
  interior: "INTERIOR",
  reconstruction: "RECONSTRUCTION",
};

/**
 * Create or update ProfessionalProfile from builder form payload (JV or contract-construction).
 * Ensures capability is added so the profile appears in marketplace.
 * Returns the profile (id is professional_id for matching).
 */
export async function upsertProfessionalProfileFromBuilderForm(payload: {
  company_name: string;
  years_experience?: string;
  address?: string;
  entity_type?: string;
  gst_number?: string;
  rera_registration?: string;
  preferred_location?: string;
  preferred_locations?: string;
  preferred_locations_list?: string[];
  location1?: string;
  location2?: string;
  location3?: string;
  project_types?: string[];
  project_caps?: string[];
  capability_type?: CapabilityType;
}): Promise<ProfessionalProfileResponse> {
  const experienceYears = payload.years_experience
    ? parseInt(payload.years_experience, 10)
    : undefined;
  const locationPreferences: string[] = [];
  if (payload.preferred_location) locationPreferences.push(payload.preferred_location);
  if (payload.preferred_locations) locationPreferences.push(payload.preferred_locations);
  if (payload.preferred_locations_list?.length) {
    locationPreferences.push(...payload.preferred_locations_list);
  }
  if (payload.location1) locationPreferences.push(payload.location1);
  if (payload.location2) locationPreferences.push(payload.location2);
  if (payload.location3) locationPreferences.push(payload.location3);
  const uniqueLocations = [...new Set(locationPreferences)].filter(Boolean);

  const body: ProfessionalProfileCreate = {
    company_name: payload.company_name,
    city: payload.address || undefined,
    experience_years: Number.isNaN(experienceYears as number) ? undefined : (experienceYears as number),
    location_preferences: uniqueLocations.length ? uniqueLocations : undefined,
  };

  let profile: ProfessionalProfileResponse;
  try {
    const existing = await getProfessionalProfile();
    profile = await updateProfessionalProfile(body);
  } catch {
    profile = await createProfessionalProfile(body);
  }

  if (payload.capability_type) {
    try {
      const caps = await listProfessionalCapabilities();
      const hasCap = caps.some((c) => c.capability_type === payload.capability_type);
      if (!hasCap) {
        await addProfessionalCapability(payload.capability_type);
      }
    } catch {
      // Capability add is best-effort; profile already created
    }
  }
  return profile;
}

// ----- Marketplace (builders & projects) -----

export interface BuilderMarketplacePortfolioItem {
  project_name: string;
  project_type?: string | null;
  location?: string | null;
  area_sqft?: number | null;
  completion_date?: string | null;
  images?: string[] | null;
}

/** Mirrors builder Portfolio type-card rows (company, experience, projects, location, updated). */
export interface BuilderMarketplacePortfolioPreview {
  has_data: boolean;
  updated_at?: string | null;
  company_name?: string | null;
  years_experience?: string | null;
  projects_completed?: string | null;
  location_summary?: string | null;
}

export interface BuilderMarketplaceCard {
  id: string;
  company_name: string;
  city?: string | null;
  /** Cities/areas the builder prefers (from professional profile). */
  location_preferences?: string[];
  experience_years?: number | null;
  rera_experience: boolean;
  credibility_score?: number | null;
  team_size_category?: string | null;
  wallet_size?: number | null;
  capability_types: string[];
  min_price_per_sqft?: number | null;
  max_price_per_sqft?: number | null;
  recent_portfolio: BuilderMarketplacePortfolioItem[];
  // Optional snapshot of latest contract-construction form payload for this builder.
  contract_form_payload?: Record<string, unknown> | null;
  /** Residential / commercial / industrial focus from contract form. */
  construction_project_types?: string[];
  /** Representative project or site name from portfolio / form (non-contact). */
  featured_project_name?: string | null;
  contract_portfolio_preview?: BuilderMarketplacePortfolioPreview | null;
  jv_portfolio_preview?: BuilderMarketplacePortfolioPreview | null;
  interior_portfolio_preview?: BuilderMarketplacePortfolioPreview | null;
  renovation_portfolio_preview?: BuilderMarketplacePortfolioPreview | null;
}

export interface ProjectMarketplaceCard {
  project_id: string;
  property_id: string;
  city: string;
  ward?: string | null;
  landmark?: string | null;
  project_type: string;
  intent?: string | null;
  asset_class?: string | null;
  budget_tier?: string | null;
  timeline?: string | null;
  scope?: string | null;
  status: string;
  total_buildable_area_sqft?: number | null;
  project_scale_tier?: string | null;
  plot_area_sqft?: number | null;
  road_width_ft?: number | null;
  tax_paid: boolean;
  e_khatha_status?: string | null;
  has_pid_verification: boolean;
  landowner_form_payload?: Record<string, unknown> | null;
}

export interface BuilderMarketplaceParams {
  city?: string;
  /** Single-cap filter (backend still accepts this). */
  capability_type?: string;
  /** Match builders with any of these capabilities (repeated query param). */
  capability_types?: string[];
  /** Fetch specific professional IDs (e.g. matched builders not in paged list). */
  professional_ids?: string[];
  intent?: string;
  pricing_tier?: string;
  rera_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface ProjectMarketplaceParams {
  city?: string;
  project_type?: string;
  intent?: string;
  asset_class?: string;
  budget_tier?: string;
  min_bua?: number;
  max_bua?: number;
  page?: number;
  page_size?: number;
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || (typeof value === "number" && Number.isNaN(value))) {
      return;
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === undefined || v === null || v === "") continue;
        search.append(key, String(v));
      }
      return;
    }
    if (value === "") {
      return;
    }
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getBuilderMarketplace(
  params: BuilderMarketplaceParams = {}
): Promise<BuilderMarketplaceCard[]> {
  const base = getBaseUrl();
  const qs = buildQuery(params);
  const res = await authFetch(`${base}/api/v1/marketplace/builders${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  return handleResponse<BuilderMarketplaceCard[]>(res);
}

export async function getProjectMarketplace(
  params: ProjectMarketplaceParams = {}
): Promise<ProjectMarketplaceCard[]> {
  const base = getBaseUrl();
  const qs = buildQuery(params);
  const res = await authFetch(`${base}/api/v1/marketplace/projects${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  return handleResponse<ProjectMarketplaceCard[]>(res);
}

// ----- Admin API (requires ADMIN role) -----

export interface AdminStats {
  total_users: number;
  users_landowner: number;
  users_professional: number;
  total_landowners: number;
  total_professionals: number;
  total_projects: number;
  projects_draft: number;
  projects_published: number;
  total_form_submissions: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  role: BackendRole;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface AdminLandownerListItem {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  created_at: string;
  user_email?: string | null;
  user_name?: string | null;
  property_count: number;
  project_count: number;
}

export interface AdminLandownerDetail {
  profile: { id: string; user_id: string; name: string; phone?: string | null; city?: string | null; created_at: string; updated_at: string };
  user_email?: string | null;
  user_name?: string | null;
  properties: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
}

export interface AdminProfessionalListItem {
  id: string;
  user_id: string;
  company_name: string;
  phone?: string | null;
  city?: string | null;
  experience_years?: number | null;
  rera_experience: boolean;
  created_at: string;
  user_email?: string | null;
  user_name?: string | null;
  capability_types: string[];
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  approved_at?: string | null;
  rejected_at?: string | null;
  has_builder_submission: boolean;
}

export interface AdminProfessionalDetail {
  profile: Record<string, unknown>;
  user_email?: string | null;
  user_name?: string | null;
  capabilities: Array<Record<string, unknown>>;
  licenses: Array<Record<string, unknown>>;
  portfolio: Array<Record<string, unknown>>;
  pricing_tiers: Array<Record<string, unknown>>;
  location_preferences?: string[] | null;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  approval_note?: string | null;
  approved_by_admin_user_id?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  has_builder_submission: boolean;
}

export interface AdminProfessionalApprovalPayload {
  status: "APPROVED" | "REJECTED";
  note?: string;
}

export interface AdminProfessionalApprovalResult {
  professional_id: string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  approval_note?: string | null;
  approved_by_admin_user_id?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  has_builder_submission: boolean;
}

export interface AdminBuilderExportRecord {
  id: string;
  scope: "single" | "bulk";
  builder_id?: string | null;
  generated_by: string;
  file_name: string;
  row_count: number;
  created_at: string;
}

export interface AdminFormSubmissionListItem {
  id: string;
  user_id?: string | null;
  form_type: string;
  side: string;
  created_at: string;
  payload?: Record<string, unknown> | null;
  user_email?: string | null;
}

export interface AdminListParams {
  skip?: number;
  limit?: number;
  role?: "LANDOWNER" | "PROFESSIONAL";
  side?: string;
  form_type?: string;
}

export interface AdminConnectionRecord {
  match_id: string;
  status: MatchStatus;
  selection_side?: string | null;
  landowner_id?: string | null;
  landowner_name?: string | null;
  landowner_email?: string | null;
  landowner_phone?: string | null;
  professional_id?: string | null;
  builder_company_name?: string | null;
  builder_email?: string | null;
  builder_phone?: string | null;
  project_id: string;
  property_id?: string | null;
  project_type?: string | null;
  project_city?: string | null;
  payment_status?: string | null;
  payment_transaction_id?: string | null;
  payment_order_id?: string | null;
  payment_id?: string | null;
  mutual_interest_at?: string | null;
  gatekeeper_unlocked_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ----- Admin: User 360 + operations -----
export interface AdminMatchSummary {
  id: string;
  project_id: string;
  professional_id: string;
  status: string;
  match_score: number;
  created_at: string;
  updated_at: string;
  mutual_interest_at?: string | null;
  gatekeeper_unlocked_at?: string | null;
}

export interface AdminTransactionListItem {
  id: string;
  user_id: string;
  project_id: string | null;
  match_id: string | null;
  transaction_type: string;
  amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  admin_resolution_status?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSupportTicketListItem {
  id: string;
  user_id?: string | null;
  role?: string | null;
  route?: string | null;
  subject: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSupportTicketDetail extends AdminSupportTicketListItem {
  description: string;
  metadata_json?: Record<string, unknown> | null;
  admin_notes?: string | null;
}

export interface AdminLoginEventItem {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

export interface AdminUser360Response {
  user: AdminUserListItem;
  last_login_at?: string | null;
  login_events: AdminLoginEventItem[];
  landowner_profile?: Record<string, unknown> | null;
  landowner_properties: Array<Record<string, unknown>>;
  landowner_projects: Array<Record<string, unknown>>;
  professional_profile?: Record<string, unknown> | null;
  professional_capabilities: Array<Record<string, unknown>>;
  professional_licenses: Array<Record<string, unknown>>;
  professional_portfolio: Array<Record<string, unknown>>;
  professional_pricing_tiers: Array<Record<string, unknown>>;
  professional_location_preferences?: string[] | null;
  form_submissions: AdminFormSubmissionListItem[];
  matches: AdminMatchSummary[];
  transactions: AdminTransactionListItem[];
  support_tickets: Array<Record<string, unknown>>;
}

export async function getAdminUser360(userId: string): Promise<AdminUser360Response> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/users/${userId}/360`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminUser360Response>(res);
}

export async function listAdminSupportTickets(params: {
  status?: string;
  user_id?: string;
  q?: string;
  skip?: number;
  limit?: number;
} = {}): Promise<AdminSupportTicketListItem[]> {
  const base = getBaseUrl();
  const qs = buildQuery({
    status: params.status,
    user_id: params.user_id,
    q: params.q,
    skip: params.skip ?? 0,
    limit: params.limit ?? 200,
  });
  const res = await authFetch(`${base}/api/v1/admin/support/tickets${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminSupportTicketListItem[]>(res);
}

export async function getAdminSupportTicket(ticketId: string): Promise<AdminSupportTicketDetail> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/support/tickets/${ticketId}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminSupportTicketDetail>(res);
}

export async function updateAdminSupportTicket(
  ticketId: string,
  patch: { status?: string; assigned_to?: string | null; admin_notes?: string | null }
): Promise<AdminSupportTicketDetail> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/support/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminSupportTicketDetail>(res);
}

export async function listAdminTransactions(params: {
  user_id?: string;
  status?: string;
  type?: string;
  q?: string;
  skip?: number;
  limit?: number;
} = {}): Promise<AdminTransactionListItem[]> {
  const base = getBaseUrl();
  const qs = buildQuery({
    user_id: params.user_id,
    status: params.status,
    type: params.type,
    q: params.q,
    skip: params.skip ?? 0,
    limit: params.limit ?? 200,
  });
  const res = await authFetch(`${base}/api/v1/admin/payments/transactions${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminTransactionListItem[]>(res);
}

export async function updateAdminTransaction(
  transactionId: string,
  patch: { admin_resolution_status?: "OPEN" | "INVESTIGATING" | "RESOLVED"; admin_notes?: string | null }
): Promise<AdminTransactionListItem> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/payments/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminTransactionListItem>(res);
}

export async function getAdminStats(): Promise<AdminStats> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/stats`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminStats>(res);
}

export async function getAdminUsers(params: AdminListParams = {}): Promise<AdminUserListItem[]> {
  const base = getBaseUrl();
  const qs = buildQuery({ skip: params.skip ?? 0, limit: params.limit ?? 100, role: params.role });
  const res = await authFetch(`${base}/api/v1/admin/users${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminUserListItem[]>(res);
}

export async function getAdminLandowners(params: AdminListParams = {}): Promise<AdminLandownerListItem[]> {
  const base = getBaseUrl();
  const qs = buildQuery({ skip: params.skip ?? 0, limit: params.limit ?? 100 });
  const res = await authFetch(`${base}/api/v1/admin/landowners${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminLandownerListItem[]>(res);
}

export async function getAdminLandownerDetail(id: string): Promise<AdminLandownerDetail> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/landowners/${id}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminLandownerDetail>(res);
}

export async function getAdminProfessionals(params: AdminListParams = {}): Promise<AdminProfessionalListItem[]> {
  const base = getBaseUrl();
  const qs = buildQuery({ skip: params.skip ?? 0, limit: params.limit ?? 100 });
  const res = await authFetch(`${base}/api/v1/admin/professionals${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminProfessionalListItem[]>(res);
}

export async function getAdminProfessionalDetail(id: string): Promise<AdminProfessionalDetail> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/professionals/${id}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminProfessionalDetail>(res);
}

export async function getAdminFormSubmissions(params: AdminListParams = {}): Promise<AdminFormSubmissionListItem[]> {
  const base = getBaseUrl();
  const qs = buildQuery({
    skip: params.skip ?? 0,
    limit: params.limit ?? 100,
    side: params.side,
    form_type: params.form_type,
  });
  const res = await authFetch(`${base}/api/v1/admin/form-submissions${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminFormSubmissionListItem[]>(res);
}

export async function getAdminConnections(params: AdminListParams = {}): Promise<AdminConnectionRecord[]> {
  const base = getBaseUrl();
  const qs = buildQuery({ skip: params.skip ?? 0, limit: params.limit ?? 100 });
  const res = await authFetch(`${base}/api/v1/admin/connections${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminConnectionRecord[]>(res);
}

export async function updateAdminProfessionalApproval(
  id: string,
  payload: AdminProfessionalApprovalPayload,
): Promise<AdminProfessionalApprovalResult> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/professionals/${id}/approval`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminProfessionalApprovalResult>(res);
}

function parseDownloadFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const m = contentDisposition.match(/filename="?([^"]+)"?/i);
  return m?.[1] ?? fallback;
}

export async function downloadAdminProfessionalExport(id: string): Promise<{ blob: Blob; fileName: string }> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/professionals/${id}/export`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return {
    blob: await res.blob(),
    fileName: parseDownloadFilename(res.headers.get("content-disposition"), `builder_${id}.xlsx`),
  };
}

export async function downloadAdminProfessionalsBulkExport(params: { skip?: number; limit?: number } = {}): Promise<{ blob: Blob; fileName: string }> {
  const base = getBaseUrl();
  const qs = buildQuery({ skip: params.skip ?? 0, limit: params.limit ?? 500 });
  const res = await authFetch(`${base}/api/v1/admin/professionals/export${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return {
    blob: await res.blob(),
    fileName: parseDownloadFilename(res.headers.get("content-disposition"), "builders_bulk.xlsx"),
  };
}

export async function listAdminProfessionalExports(params: { skip?: number; limit?: number } = {}): Promise<AdminBuilderExportRecord[]> {
  const base = getBaseUrl();
  const qs = buildQuery({ skip: params.skip ?? 0, limit: params.limit ?? 100 });
  const res = await authFetch(`${base}/api/v1/admin/professionals/exports${qs}`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<AdminBuilderExportRecord[]>(res);
}

export async function downloadAdminProfessionalExportByRecord(exportId: string): Promise<{ blob: Blob; fileName: string }> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/professionals/exports/${exportId}/download`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return {
    blob: await res.blob(),
    fileName: parseDownloadFilename(res.headers.get("content-disposition"), `builder_export_${exportId}.xlsx`),
  };
}

export async function updateAdminPassword(newPassword: string): Promise<{ message: string }> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/me/password`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<{ message: string }>(res);
}

export async function getAdminBuilderPortfolio(professionalId: string): Promise<BuilderPortfolioLatest> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/professionals/${professionalId}/builder-portfolio`, {
    method: "GET",
    headers: { ...authHeader() },
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<BuilderPortfolioLatest>(res);
}

export interface AdminProfessionalProfileUpdatePayload {
  company_name?: string;
  phone?: string | null;
  city?: string | null;
  experience_years?: number | null;
}

export async function updateAdminProfessionalProfile(
  professionalId: string,
  payload: AdminProfessionalProfileUpdatePayload,
): Promise<Record<string, unknown>> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/professionals/${professionalId}/profile`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<Record<string, unknown>>(res);
}

export async function updateAdminFormSubmission(
  submissionId: string,
  payload: Record<string, unknown>,
): Promise<FormSubmissionDetail> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/form-submissions/${submissionId}`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<FormSubmissionDetail>(res);
}

export async function deleteAdminFormSubmission(submissionId: string): Promise<void> {
  const base = getBaseUrl();
  const res = await authFetch(`${base}/api/v1/admin/form-submissions/${submissionId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (res.status === 403) throw new Error("Admin only");
  if (res.status === 204) return;
  await handleResponse<void>(res);
}

export async function updateAdminBuilderFormSubmission(
  professionalId: string,
  submissionId: string,
  payload: Record<string, unknown>,
): Promise<FormSubmissionDetail> {
  const base = getBaseUrl();
  const res = await authFetch(
    `${base}/api/v1/admin/professionals/${professionalId}/form-submissions/${submissionId}`,
    {
      method: "PATCH",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    },
  );
  if (res.status === 403) throw new Error("Admin only");
  return handleResponse<FormSubmissionDetail>(res);
}
