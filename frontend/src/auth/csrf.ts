export const CSRF_COOKIE_NAME = "csrftoken";
export const CSRF_HEADER_NAME = "X-CSRFToken";

export function buildCsrfHeaders(): HeadersInit {
  const token = readCookieValue(CSRF_COOKIE_NAME);

  if (!token) {
    return {};
  }

  return { [CSRF_HEADER_NAME]: token };
}

export function readCookieValue(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}
