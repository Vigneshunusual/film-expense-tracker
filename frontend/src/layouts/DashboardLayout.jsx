
import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Search,
  Sun,
  Moon,
  Bell,
  LogOut,
  LayoutDashboard,
  Clapperboard,
  Wallet,
  Receipt,
  Users,
  ArrowLeftRight,
  FileChartColumn,
  Settings,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { logoutUser } from "../services/authService"

function DashboardLayout() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains("dark")
  )
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const userName =
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "User"

  const navigation = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "PRODUCTION",
      items: [
        {
          name: "Productions",
          path: "/productions",
          icon: Clapperboard,
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { name: "Budgets", path: "/budgets", icon: Wallet },
        { name: "Expenses", path: "/expenses", icon: Receipt },
        { name: "Vendors", path: "/vendors", icon: Users },
        {
          name: "Payments",
          path: "/payments",
          icon: ArrowLeftRight,
        },
        {
          name: "Reports",
          path: "/reports",
          icon: FileChartColumn,
        },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { name: "Team Management", path: "/team", icon: Users },
        { name: "Settings", path: "/settings", icon: Settings },
      ],
    },
  ]

  const toggleTheme = () => {
    const nextDarkMode = !isDarkMode

    document.documentElement.classList.toggle("dark", nextDarkMode)
    setIsDarkMode(nextDarkMode)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      logout()
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground sm:w-60">
        {/* Brand */}
        <div className="flex h-[66px] shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clapperboard size={21} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight">
              CINEFINANCE
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              OGC Productions
            </p>
          </div>
        </div>

        {/* Independently scrollable navigation */}
        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-3">
          {navigation.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/dashboard"}
                      className={({ isActive }) =>
                        `flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile stays visible at the bottom */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role || "Organization Member"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main application */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="z-20 flex h-[66px] shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          {/* Compact search field */}
          <div className="relative w-full max-w-[540px] min-w-0">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="search"
              aria-label="Search productions and expenses"
              placeholder="Search productions, expenses..."
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Push actions to the far right */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Hover to view notifications; click toggles on touch devices */}
            <div
              className="relative"
              onMouseEnter={() => setIsNotificationOpen(true)}
              onMouseLeave={() => setIsNotificationOpen(false)}
            >
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
                onClick={() =>
                  setIsNotificationOpen((previous) => !previous)
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Bell size={18} />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have no new notifications.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:px-4"
            >
              <LogOut size={17} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* The active page renders here */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
