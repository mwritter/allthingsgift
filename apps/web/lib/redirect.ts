// safeNextPath keeps a post-login return path on this app.
export function safeNextPath(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return null;
  }

  try {
    const url = new URL(raw, "http://local");
    if (url.origin !== "http://local") {
      return null;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
