//AuthContext.jsx is our central authentication state manager for the React application.
//Why this file?
    //Instead of every page separately managing:
        //- Who is logged in
        //- Access token
        //- Refresh token
        //- Login
        //- Logout
    //we keep all of that in one place: AuthContext.

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

import {getCurrentUser,getCurrentOrganization,getCSRFToken,} from "../services/authService"

const AuthContext = createContext(null)

// Prevent duplicate simultaneous initialization requests in development.
let authInitializationPromise = null

const initializeAuthRequest = async (isPublicRoute) => {
  if (!authInitializationPromise) {
    authInitializationPromise = (async () => {
      await getCSRFToken()

      // Public pages do not require authentication restoration.
      if (isPublicRoute) {
        return {
          user: null,
          organization: null,
        }
      }

      // Restore authenticated user.
      const userData = await getCurrentUser()

      let organizationData = null

      // Fetch organization and role.
      try {
        organizationData = await getCurrentOrganization()
      } catch (error) {
        console.error("Unable to fetch organization:", error)
      }

      return {
        user: userData,
        organization: organizationData,
      }
    })().finally(() => {
      authInitializationPromise = null
    })
  }

  return authInitializationPromise
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  const location = useLocation()

  // Remember the initial route. Navigation should not reinitialize authentication.
  const initialPath = useRef(location.pathname)

  useEffect(() => {
    let isActive = true

    const initializeAuth = async () => {
      const currentPath = initialPath.current.replace(/\/$/, "")

      const publicRoutes = ["/login", "/register"]

      const isPublicRoute =
        publicRoutes.includes(currentPath) ||
        currentPath.startsWith("/invitations/")

      try {
        const authData = await initializeAuthRequest(isPublicRoute)

        if (!isActive) return

        setUser(authData.user)
        setOrganization(authData.organization)
      } catch (error) {
        if (!isActive) return

        setUser(null)
        setOrganization(null)

        console.error("Authentication initialization failed:", error)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isActive = false
    }
  }, [])

  // Called after successful login.
  const login = async (data) => {
    setLoading(true)
    setUser(data.user)

    try {
      const organizationData = await getCurrentOrganization()
      setOrganization(organizationData)
    } catch (error) {
      console.error("Unable to fetch organization after login:", error)
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  // Clear authentication and organization state.
  const logout = () => {
    setUser(null)
    setOrganization(null)
    setLoading(false)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}