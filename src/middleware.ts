import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This Edge Middleware acts as a native architectural barricade. 
// It executes mathematically before *any* page renders.
export function middleware(request: NextRequest) {
  // If the user attempts to physically traverse into the /dashboard subspace
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    
    // We check for the isolated V2-specific security cookie
    const authCookie = request.cookies.get('scribe_auth_v2_active');
    
    // If the cookie is absolutely missing or its value isn't strictly identical to the authentication clearance sequence
    if (!authCookie || authCookie.value !== 'six_clearance_granted') {
      
      // We natively bounce the user's browser back to the root Lock Screen entirely avoiding the dashboard render
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // If the constraints pass, allow Next.js structural compilation to proceed normally
  return NextResponse.next()
}

// Ensure the middleware strictly proxies strictly against dynamic dashboard arrays and internal APIs directly to save Edge computational overhead
export const config = {
  matcher: ['/dashboard/:path*'],
}
