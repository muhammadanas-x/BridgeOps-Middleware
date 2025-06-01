// app/api/pages/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';


const excludedPaths = ['login', 'signup', 'verification', 'RBAC', 'RBAC\\audit'];

const getPageDirectories = (dirPath, baseDir = dirPath) => {
  const result = [];

  const parse = (currentPath) => {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    const hasPageJS = items.some(item => item.isFile() && item.name === 'page.js');

    if (hasPageJS) {
      const relative = path.relative(baseDir, currentPath);
      // Only add paths that aren't in the excluded list
      if (!excludedPaths.includes(relative)) {
        result.push(relative || '.');
      }
    }

    for (const item of items) {
      if (item.isDirectory()) {
        parse(path.join(currentPath, item.name));
      }
    }
  };

  parse(dirPath);
  return result;
};

export async function GET() {
  const appPath = path.join(process.cwd(), 'app');

  if (!fs.existsSync(appPath)) {
    return NextResponse.json({ error: "'app' folder not found" }, { status: 404 });
  }

  const dirs = getPageDirectories(appPath);

  return NextResponse.json(dirs);
}



export async function POST(req) {
  try {
    const data = await req.json();
    const { pageName, path: pagePath } = data;

    // Split the path into segments to check for dynamic routes
    const pathSegments = pagePath.split('/');
    const hasDynamicRoute = pathSegments.some(segment => segment.startsWith('[') && segment.endsWith(']'));

    // Create appropriate page content based on route type
    let pageContent;
    
    if (hasDynamicRoute) {
      // Dynamic route template
      pageContent = `export default function ${pageName.split("/")[0] + "unique"}Page({ params }) {
          return (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">${pageName}</h1>
              {/* Access dynamic parameters */}
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>
          );
        }`;
    } else {
      // Static route template
      pageContent = `export default function ${pageName.split("/")[0]}Page() {
          return (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">${pageName}</h1>
              {/* Add your static page content here */}
            </div>
          );
        }`;
    }

    // Create the file path
    const filePath = path.join(process.cwd(), 'app', ...pathSegments, 'page.js');

    // Create all nested directories
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Write the file
    await fs.promises.writeFile(filePath, pageContent, 'utf-8');

    // Create layout.js for the parent folder if it doesn't exist
    const parentDir = pathSegments[0];

//     if (!fs.existsSync(layoutPath)) {
//       const layoutContent = `export default function ${parentDir.charAt(0).toUpperCase() + parentDir.slice(1)}Layout({
//   children,
// }) {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Add your layout components here */}
//       {children}
//     </div>
//   );
// }`;
      
//       await fs.promises.writeFile(layoutPath, layoutContent, 'utf-8');
//     }

    return NextResponse.json({ 
      success: true, 
      message: `Page ${pageName} created successfully`,
      type: hasDynamicRoute ? 'dynamic' : 'static',
      path: pagePath,
      layout: parentDir
    });

  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}