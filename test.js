import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as jose from 'jose';


const roleAccessMap = {
  "admin": [
    "dashboard/admin",
    "dashboard/admin/[id]"
  ]
};



const publicRoutes = ['', 'RBAC', 'RBAC/audit'];
const authRoutes = ['login', 'signup'];

const ignoredPaths = [
  '_next',
  'api',
  'favicon.ico',
  '.well-known',
  'chrome-extension:'
];

async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return {
      id: payload.userId,
      role: payload.role,
      name: payload.name,
      email: payload.email,
      isVerified: payload.isVerified,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

function isPathAllowed(path, allowedRoutes) {
  return allowedRoutes.some(route => {
    // Convert route pattern to regex (handling dynamic segments)
    const routeRegex = new RegExp('^' + route.replace(/\[.*?\]/g, '[^/]+') + '$');
    return routeRegex.test(path);
  });
}

export async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+/, '');

  // Skip ignored paths
  if (ignoredPaths.some(ignored => path.startsWith(ignored))) {
    return NextResponse.next();
  }

  // Debug logging
  console.log('Processing route:', { path, url: request.url, method: request.method });

  // Check public routes
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  const user = await getCurrentUser();
  const isAuthenticated = !!user;

  // Handle authentication routes (login/signup)
  if (authRoutes.includes(path)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // At this point, the route is not public and not an auth route
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }


  console.log('User is authenticated:', user);
  if (path === 'verification') {
    // If user is already verified, redirect to their dashboard
    if (user.isVerified) {
      console.log('User is verified, redirecting to dashboard');
      return NextResponse.redirect(new URL(`/dashboard/${user.role.toLowerCase()}`));
    }
    // Only allow access to verification page if user is not verified
    return NextResponse.next();
  }


  // Check if user is verified
  if (!user.isVerified) {
    // Redirect unverified users to verification page with their email
    const verificationUrl = new URL('/verification', request.url);
    verificationUrl.searchParams.set('email', user.email);
    return NextResponse.redirect(verificationUrl);
  }
  // Send audit log for authenticated users
  try {
    await fetch(`${url.origin}/api/audit`, {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        role: user.role,
        name: user.name,
        path,
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            '127.0.0.1',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error sending audit log:', error);
  }

  // Check role permissions
  const userRole = user.role;
  if (!userRole || !roleAccessMap[userRole]) {
    console.error(`User has invalid role: ${userRole}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if path is allowed for the user's role
  const allowedRoutes = roleAccessMap[userRole];
  
  if (isPathAllowed(path, allowedRoutes)) {
    return NextResponse.next();
  }

  // If no specific route matched, redirect to role-specific dashboard
  return NextResponse.redirect(new URL(`/dashboard/${userRole.toLowerCase()}`, request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known).*)'
  ]
};