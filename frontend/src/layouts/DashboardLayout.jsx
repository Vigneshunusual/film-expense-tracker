
import { useCallback, useEffect, useRef, useState } from "react"

import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom"

import {
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
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { logoutUser } from "../services/authService"
import { getProductions } from "../services/productionService"

function DashboardLayout() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains("dark")
  )

  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const [productions, setProductions] = useState([])
  const [selectedProduction, setSelectedProductionState] = useState(null)

  const [isProductionMenuOpen, setIsProductionMenuOpen] = useState(false)
  const [productionSearch, setProductionSearch] = useState("")

  const [isLoadingProductions, setIsLoadingProductions] = useState(true)
  const [productionError, setProductionError] = useState("")

  const navigate = useNavigate()
  const location = useLocation()

  const productionMenuRef = useRef(null)

  const { user, logout, organization } = useAuth()

  const userName =
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "User"

  const organizationName =
    organization?.organization_name || "Organization"

  // Save selected production and make it available to child pages.
  const setSelectedProduction = useCallback((production) => {
    setSelectedProductionState(production)

    if (production?.id) {
      localStorage.setItem(
        "film_tracker_selected_production",
        String(production.id)
      )
    } else {
      localStorage.removeItem("film_tracker_selected_production")
    }
  }, [])

  // Fetch productions accessible to the logged-in user.
  const fetchActiveProductions = useCallback(async () => {
    try {
      setIsLoadingProductions(true)
      setProductionError("")

      const response = await getProductions()

      const productionList = Array.isArray(response)
        ? response
        : response?.results || []

      setProductions(productionList)

      // Only ACTIVE productions are selectable.
      const activeProductions = productionList.filter(
        (production) => production.status === "ACTIVE"
      )

      const savedId = localStorage.getItem(
        "film_tracker_selected_production"
      )

      const savedProduction = activeProductions.find(
        (production) => String(production.id) === savedId
      )

      if (savedProduction) {
        setSelectedProductionState(savedProduction)
      } else if (activeProductions.length > 0) {
        setSelectedProduction(activeProductions[0])
      } else {
        setSelectedProduction(null)
      }
    } catch (error) {
      console.error("Unable to fetch productions:", error)
      setProductionError("Unable to load productions.")
    } finally {
      setIsLoadingProductions(false)
    }
  }, [setSelectedProduction])

  useEffect(() => {
    fetchActiveProductions()
  }, [fetchActiveProductions])

  // Production status filters.
  const activeProductions = productions.filter(
    (production) => production.status === "ACTIVE"
  )

  const plannedProductions = productions.filter(
    (production) => production.status === "PLANNED"
  )

  // Search active productions.
  const filteredProductions = activeProductions.filter((production) =>
    `${production.name} ${production.code}`
      .toLowerCase()
      .includes(productionSearch.toLowerCase())
  )

  // Close production selector when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        productionMenuRef.current &&
        !productionMenuRef.current.contains(event.target)
      ) {
        setIsProductionMenuOpen(false)
        setProductionSearch("")
      }
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProductionMenuOpen(false)
        setProductionSearch("")
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  // Close dropdown and notifications whenever the route changes.
  useEffect(() => {
    setIsProductionMenuOpen(false)
    setProductionSearch("")
    setIsNotificationOpen(false)
  }, [location.pathname])

  // Sidebar navigation.
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
        {
          name: "Budgets",
          path: "/budgets",
          icon: Wallet,
        },
        {
          name: "Expenses",
          path: "/expenses",
          icon: Receipt,
        },
        {
          name: "Vendors",
          path: "/vendors",
          icon: Users,
        },
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
        {
          name: "Settings",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
  ]

  // Breadcrumbs.
  const getBreadcrumbs = () => {
    const pathname = location.pathname

    if (pathname === "/dashboard") {
      return [{ label: "Dashboard", path: "/dashboard" }]
    }

    if (pathname === "/productions") {
      return [{ label: "Productions", path: "/productions" }]
    }

    if (pathname.startsWith("/productions/")) {
      return [
        { label: "Productions", path: "/productions" },
        { label: "Production Details", path: null },
      ]
    }

    const routeLabels = {
      "/budgets": "Budgets",
      "/expenses": "Expenses",
      "/vendors": "Vendors",
      "/payments": "Payments",
      "/reports": "Reports",
      "/settings": "Settings",
    }

    const currentLabel = routeLabels[pathname]

    if (currentLabel) {
      return [{ label: currentLabel, path: null }]
    }

    return [{ label: "Dashboard", path: "/dashboard" }]
  }

  const breadcrumbs = getBreadcrumbs()

  // Theme toggle.
  const toggleTheme = () => {
    const nextDarkMode = !isDarkMode

    document.documentElement.classList.toggle("dark", nextDarkMode)
    setIsDarkMode(nextDarkMode)
  }

  // Logout.
  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      localStorage.removeItem("film_tracker_selected_production")
      logout()
      navigate("/login", { replace: true })
    }
  }

  // Select an active production.
  const handleSelectProduction = (production) => {
    setSelectedProduction(production)

    setIsProductionMenuOpen(false)
    setProductionSearch("")

    if (
      location.pathname === "/productions" ||
      location.pathname.startsWith("/productions/")
    ) {
      navigate("/dashboard")
    }
  }

  // Navigate to production listing.
  const handleViewProductions = () => {
    setIsProductionMenuOpen(false)
    setProductionSearch("")
    navigate("/productions")
  }

  // Toggle production selector.
  const handleProductionMenuToggle = () => {
    setIsProductionMenuOpen((previous) => !previous)
    setProductionSearch("")
  }

  // Do not show production selector on production pages.
  const showProductionSelector =
    location.pathname !== "/productions" &&
    !location.pathname.startsWith("/productions/")

  // Show floating notification only when selector is opened
  // and no active production exists.
  const showNoActiveProductionNotice =
    isProductionMenuOpen &&
    !isLoadingProductions &&
    !productionError &&
    activeProductions.length === 0

  // Choose notification message based on available productions.
  const noActiveProductionMessage =
    plannedProductions.length > 0
      ? "Activate a planned production to access financial management."
      : "No productions available yet. Create your production to get started."

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-background text-foreground">

      {/* Sidebar */}
      <aside className="flex h-full w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sm:w-60">

        {/* Brand */}
        <div className="flex h-[66px] shrink-0 items-center gap-3 border-b border-sidebar-border px-5">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clapperboard size={21} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight">
              CINEFINANCE
            </h1>

            <p
              className="truncate text-xs text-muted-foreground"
              title={organizationName}
            >
              {organizationName}
            </p>
          </div>
        </div>

        {/* Sidebar Navigation */}
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

                      <span className="truncate">
                        {item.name}
                      </span>
                    </NavLink>
                  )
                })}

              </div>
            </div>
          ))}

        </nav>

        {/* User Profile */}
        <div className="shrink-0 border-t border-sidebar-border p-3">

          <div className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {userName}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {organization?.role || "Organization Member"}
              </p>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Application */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top Navigation */}
        <header className="z-20 flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb and Production Selector */}
          <div className="flex min-w-0 items-center gap-2 text-sm">

            <span className="hidden truncate font-semibold tracking-tight text-foreground sm:block">
              {userName}
            </span>

            {breadcrumbs.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-2"
              >
                <ChevronRight
                  size={15}
                  className="shrink-0 text-muted-foreground"
                />

                {item.path ? (
                  <button
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="truncate font-medium text-primary transition-colors hover:opacity-75"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="truncate font-medium text-primary">
                    {item.label}
                  </span>
                )}
              </div>
            ))}

            {/* Active Production Selector */}
            {showProductionSelector && (
              <div
                ref={productionMenuRef}
                className="relative ml-1"
              >

                <button
                  type="button"
                  onClick={handleProductionMenuToggle}
                  aria-expanded={isProductionMenuOpen}
                  aria-haspopup="true"
                  className="inline-flex max-w-[240px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-medium transition-colors hover:bg-accent"
                >
                  <Clapperboard
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />

                  <span className="truncate">
                    {selectedProduction?.name || "Select Production"}
                  </span>

                  <ChevronDown
                    size={15}
                    className={`shrink-0 transition-transform ${
                      isProductionMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Floating No Active Production Notification */}
                {showNoActiveProductionNotice && (
                  <div
                    role="status"
                    className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-xl"
                  >

                    <div className="flex items-start gap-3">

                      <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-700"
                      />

                      <div className="min-w-0">

                        <p className="text-sm font-semibold">
                          No active production
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          {noActiveProductionMessage}
                        </p>

                        <button
                          type="button"
                          onClick={handleViewProductions}
                          className="mt-3 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
                        >
                          View Productions
                        </button>

                      </div>
                    </div>

                  </div>
                )}

                {/* Production Dropdown */}
                {isProductionMenuOpen &&
                  !showNoActiveProductionNotice && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">

                      {/* Search */}
                      <div className="border-b border-border p-3">

                        <div className="flex items-center gap-2 rounded-lg border border-input px-3">

                          <Search
                            size={16}
                            className="shrink-0 text-muted-foreground"
                          />

                          <input
                            type="text"
                            autoFocus
                            placeholder="Find active production..."
                            value={productionSearch}
                            onChange={(event) =>
                              setProductionSearch(event.target.value)
                            }
                            className="h-10 w-full bg-transparent text-sm outline-none"
                          />

                        </div>
                      </div>

                      {/* Production List */}
                      <div className="max-h-64 overflow-y-auto p-2">

                        {filteredProductions.length > 0 ? (
                          filteredProductions.map((production) => (
                            <button
                              key={production.id}
                              type="button"
                              onClick={() =>
                                handleSelectProduction(production)
                              }
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent ${
                                selectedProduction?.id === production.id
                                  ? "bg-accent"
                                  : ""
                              }`}
                            >

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {production.name}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {production.code}
                                </p>
                              </div>

                              {selectedProduction?.id === production.id && (
                                <CheckCircle2
                                  size={17}
                                  className="shrink-0 text-emerald-600"
                                />
                              )}

                            </button>
                          ))
                        ) : (
                          <p className="p-4 text-center text-sm text-muted-foreground">
                            No matching active productions found.
                          </p>
                        )}

                      </div>

                      {/* Footer */}
                      <div className="border-t border-border p-2">

                        <button
                          type="button"
                          onClick={handleViewProductions}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
                        >
                          View all productions
                        </button>

                      </div>

                    </div>
                  )}

                {/* Loading State */}
                {isProductionMenuOpen &&
                  isLoadingProductions && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-4 text-sm text-muted-foreground shadow-xl">
                      <div className="flex items-center gap-2">
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                        Loading productions...
                      </div>
                    </div>
                  )}

                {/* API Error State */}
                {isProductionMenuOpen &&
                  productionError &&
                  !isLoadingProductions && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-destructive/30 bg-popover p-4 shadow-xl">

                      <p className="text-sm text-destructive">
                        {productionError}
                      </p>

                      <button
                        type="button"
                        onClick={fetchActiveProductions}
                        className="mt-3 text-xs font-semibold text-primary underline"
                      >
                        Try again
                      </button>

                    </div>
                  )}

              </div>
            )}

          </div>

          {/* Header Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={isDarkMode ? "Light mode" : "Dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {isDarkMode ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">

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

                  <p className="text-sm font-semibold">
                    Notifications
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    You have no new notifications.
                  </p>

                </div>
              )}

            </div>

            {/* Logout */}
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

        {/* Page Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">

          <Outlet
            context={{
              selectedProduction,
              setSelectedProduction,
              activeProductions,
              refreshProductions: fetchActiveProductions,
            }}
          />

        </main>

      </div>

    </div>
  )
}

export default DashboardLayout
