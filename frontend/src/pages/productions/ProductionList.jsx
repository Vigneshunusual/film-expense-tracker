
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  AlertCircle,
  CalendarDays,
  Clapperboard,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Eye,
} from "lucide-react"

import {
  getProductions,
  createProduction,
} from "../../services/productionService"

import { useAuth } from "../../context/AuthContext"
import CreateProductionModal from "./CreateProductionModal"

const statusStyles = {
  PLANNED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  COMPLETED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

const formatStatus = (status) => {
  return status
    ? status.charAt(0) + status.slice(1).toLowerCase()
    : "Unknown"
}

const formatDate = (date) => {
  if (!date) return "Not specified"

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate)
}

const getErrorMessage = (error) => {
  const data = error.response?.data

  if (typeof data?.detail === "string") {
    return data.detail
  }

  if (typeof data === "string") {
    return data
  }

  if (!error.response) {
    return "Unable to connect to the server. Check your backend connection."
  }

  return "Something went wrong while loading productions. Please try again."
}

function ProductionList() {
  const navigate = useNavigate()

  const { organization } = useAuth()

  // Only organization Owners can create productions.
  const canCreateProduction = organization?.role === "OWNER"

  const [productions, setProductions] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Create production modal state.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  // Fetch productions from the backend.
  const fetchProductions = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const data = await getProductions()

      // Support both paginated and non-paginated DRF responses.
      const productionList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : null

      if (!productionList) {
        throw new Error("Unexpected production API response.")
      }

      setProductions(productionList)
    } catch (err) {
      console.error("Production loading failed:", err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductions()
  }, [fetchProductions])

  // Create a new production through the backend API.
  const handleCreateProduction = async (productionData) => {
    setCreating(true)
    setCreateError("")

    try {
      await createProduction(productionData)

      setIsCreateModalOpen(false)

      // Refresh the production list after successful creation.
      await fetchProductions()

      return true
    } catch (err) {
      console.error("Production creation failed:", err)

      const data = err.response?.data

      if (typeof data?.detail === "string") {
        setCreateError(data.detail)
      } else if (data && typeof data === "object") {
        const messages = Object.values(data).flat()

        const firstError = messages.find(
          (message) => typeof message === "string"
        )

        setCreateError(
          firstError ||
            "Unable to create production. Please check your details."
        )
      } else {
        setCreateError("Unable to create production. Please try again.")
      }

      return false
    } finally {
      setCreating(false)
    }
  }

  // Search and status filtering.
  const filteredProductions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return productions.filter((production) => {
      const matchesSearch =
        production.name?.toLowerCase().includes(normalizedQuery) ||
        production.code?.toLowerCase().includes(normalizedQuery)

      const matchesStatus =
        selectedStatus === "ALL" ||
        production.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [productions, searchQuery, selectedStatus])

  // Calculate production overview statistics.
  const productionStats = useMemo(() => {
    return {
      total: productions.length,

      active: productions.filter(
        (production) => production.status === "ACTIVE"
      ).length,

      planned: productions.filter(
        (production) => production.status === "PLANNED"
      ).length,

      completed: productions.filter(
        (production) => production.status === "COMPLETED"
      ).length,
    }
  }, [productions])

  const overviewCards = [
    {
      title: "Total Productions",
      value: productionStats.total,
      description: "All accessible productions",
      icon: FolderOpen,
    },
    {
      title: "Active Productions",
      value: productionStats.active,
      description: "Currently in progress",
      icon: Clapperboard,
    },
    {
      title: "Planned Productions",
      value: productionStats.planned,
      description: "Scheduled productions",
      icon: CalendarDays,
    },
    {
      title: "Completed Productions",
      value: productionStats.completed,
      description: "Finished productions",
      icon: FolderOpen,
    },
  ]

  return (
    <div className="min-h-full space-y-6">

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Clapperboard size={23} className="text-primary" />

            <h1 className="text-2xl font-bold tracking-tight">
              Productions
            </h1>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage and monitor your organization's film productions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* New Production button - Owner only */}
          {canCreateProduction && (
            <button
              type="button"
              onClick={() => {
                setCreateError("")
                setIsCreateModalOpen(true)
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus size={17} />
              New Production
            </button>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchProductions}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>
      </section>

      {/* Production Overview */}
      <section
        aria-label="Production overview"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {overviewCards.map((stat) => {
          const Icon = stat.icon

          return (
            <article
              key={stat.title}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </article>
          )
        })}
      </section>

      {/* Search and filters */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by production name or code..."
            aria-label="Search productions"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          aria-label="Filter productions by status"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
        >
          <option value="ALL">All statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </section>

      {/* Production count */}
      {!loading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredProductions.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {productions.length}
            </span>{" "}
            productions
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <section
          aria-label="Loading productions"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-border bg-card p-5"
            >
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-4 h-4 w-1/3 rounded bg-muted" />
              <div className="mt-8 h-4 w-1/2 rounded bg-muted" />
              <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </section>
      )}

      {/* Error state */}
      {!loading && error && (
        <section
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <AlertCircle
            size={30}
            className="mx-auto text-destructive"
          />

          <h2 className="mt-3 font-semibold">
            Unable to load productions
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchProductions}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </section>
      )}

      {/* Empty state */}
      {!loading && !error && productions.length === 0 && (
        <section className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <FolderOpen size={27} className="text-muted-foreground" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No productions yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Your organization does not have any productions available yet.
            Productions will appear here once they are created.
          </p>
        </section>
      )}

      {/* No search results */}
      {!loading &&
        !error &&
        productions.length > 0 &&
        filteredProductions.length === 0 && (
          <section className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <Search
              size={27}
              className="mx-auto text-muted-foreground"
            />

            <h2 className="mt-4 font-semibold">
              No matching productions
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Try changing your search or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setSelectedStatus("ALL")
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </section>
        )}

      {/* Production cards */}
      {!loading && !error && filteredProductions.length > 0 && (
        <section
          aria-label="Production list"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredProductions.map((production) => (
            <article
              key={production.id}
              className="group min-w-0 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clapperboard size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-semibold tracking-tight">
                      {production.name}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Code: {production.code}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    statusStyles[production.status] ||
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {formatStatus(production.status)}
                </span>
              </div>

              {/* Production dates */}
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={16} />

                  <span>Start date</span>

                  <span className="ml-auto font-medium text-foreground">
                    {formatDate(production.start_date)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={16} />

                  <span>End date</span>

                  <span className="ml-auto font-medium text-foreground">
                    {formatDate(production.end_date)}
                  </span>
                </div>
              </div>

              {/* View Details */}
              <div className="mt-5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/productions/${production.id}`)
                  }
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Create Production Modal */}
      <CreateProductionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setCreateError("")
        }}
        onSubmit={handleCreateProduction}
        submitting={creating}
        error={createError}
      />

    </div>
  )
}

export default ProductionList
