import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication
const protectedRoutes = ['/merchant', '/admin']

// Routes only accessible to admins
const adminOnlyRoutes = ['/admin']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh auth token
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route))

  if (isProtectedRoute) {
    // Not logged in - redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is in admin_users table and get their role
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser) {
      // User is authenticated but not a staff member
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check admin-only routes
    if (isAdminRoute && adminUser.role !== 'admin') {
      // Barista trying to access admin route - redirect to merchant
      return NextResponse.redirect(new URL('/merchant', request.url))
    }
  }

  // Redirect authenticated users away from login page
  if (path === '/login' && user) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser) {
      // Redirect based on role
      const redirectTo = adminUser.role === 'admin' ? '/admin' : '/merchant'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (allow API access)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
