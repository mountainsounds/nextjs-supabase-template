import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client.
 * Use this in Server Components, Server Functions, and Route Handlers.
 *
 * cookies() is async in Next.js 16 — this function is therefore async.
 */
export async function createClient() {
  // In Next.js 16, cookies() returns a Promise — must await it.
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can only be
            // set in Server Functions / Route Handlers. Safe to ignore here
            // if you're only reading cookies (e.g. getting the session).
          }
        },
      },
    }
  )
}
