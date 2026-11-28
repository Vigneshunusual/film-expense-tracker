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
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { logoutUser } from "../services/authService"
import { getProductions } from "../services/productionService"

function DashboardLayout() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => document.documentElement.classList.contains("dark")
  )

  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Desktop sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  // Save selected production.
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

  const activeProductions = productions.filter(
    (production) => production.status === "ACTIVE"
  )

  const plannedProductions = productions.filter(
    (production) => production.status === "PLANNED"
  )

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

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  // Close menus and mobile sidebar when route changes.
  useEffect(() => {
    setIsProductionMenuOpen(false)
    setProductionSearch("")
    setIsNotificationOpen(false)
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  // Escape closes mobile sidebar and dropdowns.
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProductionMenuOpen(false)
        setProductionSearch("")
        setIsNotificationOpen(false)
        setIsMobileSidebarOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

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
          name: "Team",
          path: "/team",
          icon: Users,
        },
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
      "/team": "Team",
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

  const showProductionSelector =
    location.pathname !== "/productions" &&
    !location.pathname.startsWith("/productions/")

  const showNoActiveProductionNotice =
    isProductionMenuOpen &&
    !isLoadingProductions &&
    !productionError &&
    activeProductions.length === 0

  const noActiveProductionMessage =
    plannedProductions.length > 0
      ? "Activate a planned production to access financial management."
      : "No productions available yet. Create your production to get started."

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-background text-foreground">

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-full shrink-0 flex-col
          border-r border-sidebar-border bg-sidebar text-sidebar-foreground
          shadow-xl transition-all duration-300 ease-in-out
          md:relative md:z-10 md:translate-x-0 md:shadow-none
          ${
            isSidebarCollapsed
              ? "md:w-[72px]"
              : "w-[min(82vw,280px)] md:w-56 lg:w-60"
          }
          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >

        {/* Brand */}
        <div
          className={`
            flex h-[66px] shrink-0 items-center border-b border-sidebar-border
            ${
              isSidebarCollapsed
                ? "justify-center px-2"
                : "justify-between gap-3 px-5"
            }
          `}
        >

          <div
            className={`flex min-w-0 items-center ${
              isSidebarCollapsed ? "justify-center" : "gap-3"
            }`}
          >

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clapperboard size={21} />
            </div>

            {!isSidebarCollapsed && (
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
            )}

          </div>

          {/* Mobile close button */}
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <X size={20} />
          </button>

        </div>

        {/* Sidebar Navigation */}
        <nav
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
            isSidebarCollapsed ? "space-y-5 p-2" : "space-y-6 p-3"
          }`}
        >

          {navigation.map((section) => (
            <div key={section.title}>

              {!isSidebarCollapsed && (
                <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">

                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/dashboard"}
                      title={isSidebarCollapsed ? item.name : undefined}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex min-h-10 items-center rounded-lg py-2 text-sm transition-colors ${
                          isSidebarCollapsed
                            ? "justify-center px-0"
                            : "gap-3 px-3"
                        } ${
                          isActive
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      <Icon size={17} className="shrink-0" />

                      {!isSidebarCollapsed && (
                        <span className="truncate">
                          {item.name}
                        </span>
                      )}
                    </NavLink>
                  )
                })}

              </div>
            </div>
          ))}

        </nav>

        {/* User Profile */}
        <div className="shrink-0 border-t border-sidebar-border p-3">

          <div
            className={`flex min-w-0 items-center rounded-lg py-2 ${
              isSidebarCollapsed
                ? "justify-center px-0"
                : "gap-3 px-2"
            }`}
          >

            <div
              title={isSidebarCollapsed ? userName : undefined}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold"
            >
              {userName.charAt(0).toUpperCase()}
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {userName}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {organization?.role || "Organization Member"}
                </p>
              </div>
            )}

          </div>
        </div>

      </aside>

      {/* Main Application */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top Navigation */}
        <header className="z-30 flex h-[66px] shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 sm:gap-4 sm:px-6 lg:px-8">

          {/* Left Header Section */}
          <div className="flex min-w-0 items-center gap-2">

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={isMobileSidebarOpen}
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent md:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Laptop collapse / expand */}
            <button
              type="button"
              aria-label={
                isSidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              title={
                isSidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              onClick={() =>
                setIsSidebarCollapsed((previous) => !previous)
              }
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent md:flex"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>

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
                    className="inline-flex max-w-[150px] items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-xs font-medium transition-colors hover:bg-accent sm:max-w-[240px] sm:px-3 sm:text-sm"
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

                  {/* No Active Production Notification */}
                  {showNoActiveProductionNotice && (
                    <div
                      role="status"
                      className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-xl"
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
                      <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">

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
                      <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-popover p-4 text-sm text-muted-foreground shadow-xl">
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
                      <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-destructive/30 bg-popover p-4 shadow-xl">

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
          </div>

          {/* Header Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground sm:h-10 sm:w-10"
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
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground sm:h-10 sm:w-10"
              >
                <Bell size={18} />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg">

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
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:h-10 sm:px-4"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Log Out</span>
            </button>

          </div>

        </header>

        {/* Page Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background p-3 sm:p-6 lg:p-8">

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