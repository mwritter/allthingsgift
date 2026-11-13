// The marketing site owns /. This app is served only under /dashboard.
export const basePath = "/dashboard"

// Next.js navigation (Link, router, redirect) is relative to basePath.
// Browser URLs, emails, and window.location include it.
export function toAppPath(path: string): string {
  const hashIndex = path.indexOf("#")
  const withoutHash = hashIndex === -1 ? path : path.slice(0, hashIndex)
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex)
  const queryIndex = withoutHash.indexOf("?")
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex)
  const query = queryIndex === -1 ? "" : withoutHash.slice(queryIndex)

  let appPath = pathname
  if (pathname === basePath) {
    appPath = "/"
  } else if (pathname.startsWith(`${basePath}/`)) {
    appPath = pathname.slice(basePath.length)
  }

  return `${appPath}${query}${hash}`
}

export function toPublicPath(appPath: string): string {
  if (
    appPath === basePath ||
    appPath.startsWith(`${basePath}/`) ||
    appPath.startsWith(`${basePath}?`)
  ) {
    return appPath
  }
  if (appPath === "/" || appPath.startsWith("/?") || appPath.startsWith("/#")) {
    return `${basePath}${appPath.slice(1)}`
  }
  if (appPath.startsWith("/")) {
    return `${basePath}${appPath}`
  }
  return appPath
}
