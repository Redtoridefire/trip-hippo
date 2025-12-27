import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

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

function createMockClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
      signUp: async () => ({ error: { message: "Supabase not configured" } }),
      signInWithOAuth: async () => ({ error: { message: "Supabase not configured" } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as unknown as ReturnType<typeof createBrowserClient>
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build/prerender, return a mock client
  if (!isValidSupabaseUrl(supabaseUrl) || !supabaseAnonKey) {
    return createMockClient()
  }

  // Reuse client on the browser
  if (client) return client

  client = createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  return client
}
