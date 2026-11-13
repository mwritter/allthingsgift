import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { toPublicPath } from "@/lib/base-path";
import { NextResponse, type NextRequest } from "next/server";

const REQUEST_PATH_HEADER = "x-pathname";

// Dashboard pages require a session. A missing cookie goes to login and comes
// back to the page that was opened. The header lets requireUser do the same
// when the cookie is present but no longer valid.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nextPath = toPublicPath(`${pathname}${search}`);
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", nextPath);
    return NextResponse.redirect(login);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_PATH_HEADER, nextPath);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Paths are relative to basePath. Next prefixes them with /dashboard.
  // "/" is separate so the dashboard home is matched, not only nested routes.
  matcher: ["/", "/((?!login|auth|api|_next|.*\\..*).*)"],
};
