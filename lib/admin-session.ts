const ADMIN_SESSION_KEY = "sushi_admin_session";
const DEMO_USER = "adan";
const DEMO_PASSWORD = "adan";

export function isDemoAdmin(user: string, password: string) {
  return user.trim().toLowerCase() === DEMO_USER && password === DEMO_PASSWORD;
}

export function saveAdminSession() {
  window.localStorage.setItem(ADMIN_SESSION_KEY, "adan");
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function hasAdminSession() {
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === "adan";
}
