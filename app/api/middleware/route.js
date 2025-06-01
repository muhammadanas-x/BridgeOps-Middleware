// app/api/writeMiddleware/route.js
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

















export async function POST(req) {
  
  try {
    const body = await req.json(); // incoming connections array

    // Step 1: Build roleAccessMap from connections
    const roleAccessMap = {};
    for (const conn of body) {
      const role = conn.from;
      console.log('Role:', role);
      const route = conn.to;

      if (!roleAccessMap[role]) {
        roleAccessMap[role] = new Set();
      }
      roleAccessMap[role].add(route);
    }

    // Convert Sets to Arrays for JSON stringification
    for (const role in roleAccessMap) {
      roleAccessMap[role] = Array.from(roleAccessMap[role]);
    }

    // Step 2: Build middleware.js content
  const middlewareContent = `import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as jose from 'jose';

const roleAccessMap = ${JSON.stringify(roleAccessMap, null, 2)};

const publicRoutes = ['', 'RBAC', 'RBAC/audit'];
const authRoutes = ['login', 'signup'];

const ignoredPaths = [
  '_next',
  'api',
  'favicon.ico',
  '.well-known',
  'chrome-extension:',
  // Add static file extensions and paths
  '.glb',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  'public'
];

async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined');
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
    const routeRegex = new RegExp('^' + route.replace(/\\[.*?\\]/g, '[^/]+') + '$');
    return routeRegex.test(path);
  });
}

export async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\\/+/, '');

  // Skip ignored paths (expanded to include static file types)
  if (ignoredPaths.some(ignored => 
    path.startsWith(ignored) || 
    path.endsWith(ignored) || 
    path.includes(\`\${ignored}\`)
  )) {
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
      return NextResponse.redirect(new URL(\`/dashboard/\${user.role.toLowerCase()}\`, request.url));
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
    const auditResponse = await fetch(new URL('/api/audit', url.origin), {
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

    if (!auditResponse.ok) {
      console.error('Audit log failed:', await auditResponse.text());
    }
  } catch (error) {
    console.error('Error sending audit log:', error);
  }

  // Check role permissions
  const userRole = user.role;
  if (!userRole || !roleAccessMap[userRole]) {
    console.error(\`User has invalid role: \${userRole}\`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if path is allowed for the user's role
  const allowedRoutes = roleAccessMap[userRole];
  
  if (isPathAllowed(path, allowedRoutes)) {
    return NextResponse.next();
  }

  // If no specific route matched, redirect to role-specific dashboard
  return NextResponse.redirect(new URL(\`/dashboard/\${userRole.toLowerCase()}\`, request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known).*)'
  ]
};`;
// ...existing code...


                          
    // Step 3: Write to middleware.js
    const filePath = path.resolve(process.cwd(), 'middleware.js');
    await writeFile(filePath, middlewareContent);

    return new Response(JSON.stringify({ message: 'middleware.js created successfully' }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    // Try to read the existing middleware.js file to get the current roleAccessMap
    const filePath = path.resolve(process.cwd(), 'middleware.js');
    let currentConnections = [];
    
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      // Extract the roleAccessMap from the file content
      const mapMatch = fileContent.match(/const roleAccessMap = (\{.*?\});/s);
      if (mapMatch && mapMatch[1]) {
        const roleAccessMap = JSON.parse(mapMatch[1]);
        // Convert back to connections array format
        for (const role in roleAccessMap) {
          for (const route of roleAccessMap[role]) {
            currentConnections.push({ from: role, to: route });
          }
        }

        console.log('Current connections:', currentConnections);
      }
    } catch (err) {
      // File doesn't exist or couldn't be read - return empty array
      console.log('No existing middleware.js file found, returning empty connections');
    }

    return new Response(JSON.stringify(currentConnections), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}