//AuthContext.jsx is our central authentication state manager for the React application.
//Why this file?
    //Instead of every page separately managing:
        //- Who is logged in
        //- Access token
        //- Refresh token
        //- Login
        //- Logout
    //we keep all of that in one place: AuthContext.


import { createContext, useContext, useState } from "react"
import { useEffect } from "react"
import { getCurrentUser,getCSRFToken } from "../services/authService"  //Sends a request to Django to get the currently logged-in user's information. 
import { useLocation } from "react-router-dom"


const AuthContext = createContext(null)  // cretae context() is a place to store the shared data. We will store the authentication state here.
           //AuthContext->Stores login information->Available to the whole React app
export const AuthProvider = ({ children }) => {


  const [user, setUser] = useState(null)    //Stores the logged-in user's information.
  const [loading, setLoading] = useState(true)
  const location = useLocation()  //Get the current URL path. We will use this to determine whether we are on a public page or a protected page.

  // Restore logged-in user when the app starts
  useEffect(() => {  //Run this code when the component starts."

    // /login and /login/ are treated the same
    const currentPath = location.pathname.replace(/\/$/, "")    //Take the current URL path and remove the / if it is at the very end.
    const publicRoutes = ["/login", "/register"]

    // Check whether current page is public
    const isPublicRoute = publicRoutes.includes(currentPath)   //Is the current URL present inside publicRoutes?

    //Why do CSRF first?
          //Because we want the browser to already have the CSRF cookie before React starts making future POST/PUT/PATCH/DELETE requests.
    const initializeAuth = async () => {
      try {
        // Always make sure CSRF cookie exists
        // Get the CSRF cookie from Django.
        // This ensures the browser has a CSRF token before any
        // POST, PUT, PATCH, or DELETE request.
        await getCSRFToken()  

        // Public pages don't need authentication check
        if (isPublicRoute) {
            return
        }

        const data = await getCurrentUser()   //it calls GET /api/auth/me/
        setUser(data)  
      }

      catch (error) {   //If /me fails  : 401 Unauthorized
        setUser(null)
      } 

      finally {    //Whether /me succeeds or fails:
        setLoading(false)
      }
    }
    initializeAuth() //call the async function to restore the logged-in user when the app starts.
  }, [location.pathname])  //User goes to /login or /register -> Skip /me  and User goes to /dashboard or refreshes/dashboard -> Run /me 


  //now we are using http only cookies to store the access and refresh tokens, so we don't need to store them in React state anymore.
  //const [accessToken, setAccessToken] = useState(null)   //Stores the JWT access token.
  //const [refreshToken, setRefreshToken] = useState(null)  //Stores the JWT refresh token

  const login = (data) => {   //When Django successfully logs in the user, we store the returned data.

    setUser(data.user)    // Store this user's information in React's global authentication state."when its navigates to otehr pages, it will know that the user is logged in."
    //setAccessToken(data.access)   //Store the access token in React's global authentication state.
    //setRefreshToken(data.refresh)  //Store the refresh token in React's global authentication state.
  }

  const logout = () => {  //clears authentication data.
    setUser(null)
    // setAccessToken(null)
    // setRefreshToken(null)
  }

  const isAuthenticated = !!user  //isAuthenticated is true if user is not null, false if user is null. (!! converts a value to a boolean)

  return (
    <AuthContext.Provider
      value={{user,isAuthenticated,login,logout,loading}}
    >
        {children}
    </AuthContext.Provider>
  )
}


export const useAuth = () => {
  return useContext(AuthContext)
}

//Instead of passing authentication data through props to every component, 

// we store it centrally in AuthContext and access it wherever needed using useAuth().