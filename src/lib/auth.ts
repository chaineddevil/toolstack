export const ADMIN_SESSION_COOKIE = "toolstack_admin";

export function isAdminRequest(headers: Headers): boolean {
  const cookie = headers.get("cookie") || "";
  return cookie.includes(`${ADMIN_SESSION_COOKIE}=1`);
}

