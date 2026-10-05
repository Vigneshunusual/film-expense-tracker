import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"


//ProtectedRoute is used to prevent unauthenticated users from accessing protected pages like Dashboard.
function ProtectedRoute() {
  const { isAuthenticated,loading } = useAuth()

  if (loading) {   //This prevents React from incorrectly redirecting a logged-in user to /login while /me is still being checked.
    return <div>Loading...</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />   //If the user is not authenticated, redirect to the login page.
  }

  return <Outlet />   //"Outlet means: Render the child route here if the user is authenticated."  (which means Dashboard)
}

export default ProtectedRoute