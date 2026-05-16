import { NextResponse } from "next/server";

export function middleware(request) {
  const sessionCookie = request.cookies.get("session");

  // Not logged in
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let role;

  try {
    const session = JSON.parse(sessionCookie.value);
    role = session.role;
  } catch (err) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const path = request.nextUrl.pathname;

  // RBAC map
  const routeRoles = {
    // ADMIN ONLY
    "/lmsMainPageAdmin": ["administrator"],
    "/createAccount": ["administrator"],

    // TEACHER + ADMIN
    "/addCourse": ["administrator", "teacher"],
    "/editCourse": ["administrator", "teacher"],
    "/manageStudent": ["administrator", "teacher"],

    // ASSISTANT ONLY PAGE
    "/manageMainPageAssistant": ["assistant"],

    // SHARED (ADMIN / TEACHER / ASSISTANT)
    "/addAssignment": ["administrator", "teacher", "assistant"],
    "/editAssignment": ["administrator", "teacher", "assistant"],
    "/manageAssignment": ["administrator", "teacher", "assistant"],
    "/manageMaterial": ["administrator", "teacher", "assistant"],

    // ADMIN + TEACHER
    "/manageMainPage": ["administrator", "teacher"],
    "/manageAssistance": ["administrator", "teacher"],

    // STUDENT ONLY
    "/lmsMainPageStudent": ["student"],

    // COMMON FOR ALL ROLES
    "/courseDetails": ["administrator", "teacher", "assistant", "student"],
    "/editInformation": ["administrator", "teacher", "assistant", "student"],

    // TEACHER + ASSISTANT MAIN
    "/lmsMainPage": ["teacher", "assistant"],
  };

  // IMPORTANT: sort routes to avoid prefix conflicts
  const sortedRoutes = Object.keys(routeRoles).sort(
    (a, b) => b.length - a.length,
  );

  for (const route of sortedRoutes) {
    const isMatch = path === route || path.startsWith(route + "/");

    if (isMatch) {
      const allowedRoles = routeRoles[route];

      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      break; // stop after first match
    }
  }

  return NextResponse.next();
}

// Protect all relevant routes
export const config = {
  matcher: [
    "/lmsMainPage/:path*",
    "/lmsMainPageAdmin/:path*",
    "/lmsMainPageStudent/:path*",

    "/addAssignment/:path*",
    "/addCourse/:path*",
    "/courseDetails/:path*",

    "/createAccount/:path*",

    "/editAssignment/:path*",
    "/editCourse/:path*",
    "/editInformation/:path*",

    "/manageAssignment/:path*",
    "/manageAssistance/:path*",
    "/manageMainPage/:path*",
    "/manageMainPageAssistant/:path*",
    "/manageMaterial/:path*",
    "/manageStudent/:path*",
  ],
};
