import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"
import {logoutUser, getCurrentOrganization,} from "../services/authService"


function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()


  // Load current organization when Dashboard opens
  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const data = await getCurrentOrganization()
        console.log("Organization:", data)
      } 
      catch (error) {
        console.error("Organization request failed:", error)
      }
    }
    loadOrganization()
  }, [])  //runs only once when the Dashboard component is first rendered.

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser()
      logout()
      navigate("/login")
    } 
    catch (error) {
      console.error("Logout failed:", error)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="text-center">

        <h1 className="text-3xl font-bold">
          Welcome, {user?.first_name}
        </h1>

        <p className="text-gray-500 mt-2">
          Film Tracker Dashboard
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Logout
        </button>

      </div>

    </div>
  )
}

export default Dashboard