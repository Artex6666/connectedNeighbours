import { useMemo } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/shared/context/AuthContext'
import { ChatWidget } from '@/shared/ui/ChatWidget'
import { router } from '@/app/router'

/**
 * Messaging bubble, mounted once at the app root so it's available on every
 * page — but only when the user is logged in.
 */
function GlobalChat() {
  const { isAuthenticated, accessToken, user } = useAuth()
  const session = useMemo(
    () => (isAuthenticated && accessToken && user ? { accessToken, refreshToken: '', user } : null),
    [isAuthenticated, accessToken, user],
  )
  if (!session) return null
  return <ChatWidget isAuthenticated session={session} onRequireAuth={() => undefined} />
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <GlobalChat />
    </AuthProvider>
  )
}

export default App
