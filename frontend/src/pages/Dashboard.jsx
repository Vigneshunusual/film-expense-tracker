import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {logoutUser,getCurrentOrganization,} from "../services/authService"
import InviteStaffForm from "../components/InviteStaffForm"

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Load current organization when Dashboard opens
  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const data = await getCurrentOrganization()
        console.log("Organization:", data)
      } catch (error) {
        console.error("Organization request failed:", error)
      }
    }

    loadOrganization()
  }, [])

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser()
      logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">

      {/* Dashboard Header */}
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {user?.first_name}
          </h1>

          <p className="mt-2 text-gray-500">
            Film Tracker Dashboard
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Logout
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="mx-auto mt-10 max-w-6xl">

        {/* Invite Staff Section */}
        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Team Management
          </h2>

          <InviteStaffForm />
        </section>

      </div>

    </div>
  )
}

export default Dashboard