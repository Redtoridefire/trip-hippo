import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false
  if (url === "https://placeholder.supabase.co") return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// Mock client for build time when env vars aren't available
function createMockClient() {
  // Create a chainable mock that returns itself for any method call
  const createChainableMock = (): unknown => {
    const mock = {
      data: [],
      error: null,
      then: (resolve: (value: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    return new Proxy(mock, {
      get(target, prop) {
        if (prop === "data") return []
        if (prop === "error") return null
        if (prop === "then") return target.then
        return () => createChainableMock()
      },
    })
  }

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: { message: "Supabase not configured" } }),
    },
    from: () => createChainableMock(),
  } as unknown as ReturnType<typeof createServerClient>
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build/prerender, return a mock client
  if (!isValidSupabaseUrl(supabaseUrl) || !supabaseAnonKey) {
    return createMockClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return createMockClient()
  }

  // Service role client for privileged operations
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(supabaseUrl, serviceRoleKey)
}
