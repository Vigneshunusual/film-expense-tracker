import { useCallback, useEffect, useState } from "react"

import {
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom"

import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Clock,
  Edit,
  RefreshCw,
  CheckCircle2,
  Archive,
  RotateCcw,
  Play,
  CheckCircle,
} from "lucide-react"

import { useAuth } from "../../context/AuthContext"

import {
  getProduction,
  updateProduction,
  activateProduction,
  completeProduction,
  archiveProduction,
  restoreProduction,
} from "../../services/productionService"

import EditProductionModal from "./EditProductionModal"

const statusStyles = {
  ACTIVE:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

  PLANNED:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",

  COMPLETED:
    "border-border bg-muted text-muted-foreground",

  ARCHIVED:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

const formatStatus = (status) => {
  if (!status) return "Unknown"

  return status.charAt(0) + status.slice(1).toLowerCase()
}

function ProductionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { organization } = useAuth()
  const { refreshProductions } = useOutletContext()

  const [production, setProduction] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState("")

  const [successMessage, setSuccessMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const canEdit =
    organization?.role === "OWNER" ||
    organization?.role === "MANAGER"

  const isOwner = organization?.role === "OWNER"

  // Fetch production details.
  const fetchProduction = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true)
        }

        setError("")

        const data = await getProduction(id)

        setProduction(data)

        return data
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Unable to load production details."
        )

        return null
      } finally {
        if (showLoader) {
          setLoading(false)
        }
      }
    },
    [id]
  )

  useEffect(() => {
    fetchProduction()
  }, [fetchProduction])

  // Refresh production and shared selector.
  const refreshAfterLifecycleAction = async () => {
    await fetchProduction(false)
    await refreshProductions()
  }

  // Update production details.
  const handleUpdateProduction = async (formData) => {
    try {
      setIsUpdating(true)
      setUpdateError("")
      setSuccessMessage("")

      const { status, ...editableData } = formData

      await updateProduction(id, editableData)

      await refreshAfterLifecycleAction()

      setIsEditModalOpen(false)

      setSuccessMessage(
        "Production details updated successfully."
      )
    } catch (err) {
      const backendError = err.response?.data

      if (backendError && typeof backendError === "object") {
        const firstError = Object.values(backendError).flat()[0]

        setUpdateError(
          typeof firstError === "string"
            ? firstError
            : "Unable to update production."
        )
      } else {
        setUpdateError(
          "Unable to update production. Please try again."
        )
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // Activate production.
  const handleActivate = async () => {
    const confirmed = window.confirm(
      `Activate "${production.name}"?`
    )

    if (!confirmed) return

    try {
      setIsProcessing(true)
      setError("")
      setSuccessMessage("")

      await activateProduction(id)

      await refreshAfterLifecycleAction()

      setSuccessMessage(
        "Production activated successfully."
      )
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to activate production."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Complete production.
  const handleComplete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to complete "${production.name}"?`
    )

    if (!confirmed) return

    try {
      setIsProcessing(true)
      setError("")
      setSuccessMessage("")

      await completeProduction(id)

      await refreshAfterLifecycleAction()

      setSuccessMessage(
        "Production completed successfully."
      )
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to complete production."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Archive production.
  const handleArchive = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${production.name}"?`
    )

    if (!confirmed) return

    try {
      setIsProcessing(true)
      setError("")
      setSuccessMessage("")

      await archiveProduction(id)

      await refreshProductions()

      navigate("/productions", {
        state: {
          message: "Production archived successfully.",
        },
      })
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to archive production."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Restore production.
  const handleRestore = async () => {
    const confirmed = window.confirm(
      `Restore "${production.name}"? It will return to Planned status.`
    )

    if (!confirmed) return

    try {
      setIsProcessing(true)
      setError("")
      setSuccessMessage("")

      await restoreProduction(id)

      await refreshAfterLifecycleAction()

      setSuccessMessage(
        "Production restored successfully. Its status is now Planned."
      )
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to restore production."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Date formatting.
  const formatDate = (date) => {
    if (!date) return "Not specified"

    const parsedDate = new Date(`${date}T00:00:00`)

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available"
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw
          className="animate-spin text-primary"
          size={28}
        />
      </div>
    )
  }

  // Error state.
  if (error && !production) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/productions")}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={17} />
          Back to Productions
        </button>

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  if (!production) return null

  const productionFields = [
    {
      label: "Production Name",
      value: production.name,
      icon: Clapperboard,
    },
    {
      label: "Production Code",
      value: production.code,
      icon: Clapperboard,
    },
    {
      label: "Production Status",
      value: formatStatus(production.status),
      icon: CheckCircle2,
      isStatus: true,
    },
    {
      label: "Start Date",
      value: formatDate(production.start_date),
      icon: CalendarDays,
    },
    {
      label: "Expected End Date",
      value: formatDate(production.end_date),
      icon: CalendarDays,
    },
    {
      label: "Last Updated",
      value: production.updated_at
        ? new Date(production.updated_at).toLocaleString("en-IN")
        : "Not available",
      icon: Clock,
    },
  ]

  const buttonBase =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="min-h-full space-y-6 text-foreground">

      {/* Page Header */}
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">

        <div className="min-w-0">

          <button
            type="button"
            onClick={() => navigate("/productions")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={17} />
            Back to Productions
          </button>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {production.name}
            </h1>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[production.status] ||
                "border-border bg-muted text-muted-foreground"
              }`}
            >
              {formatStatus(production.status)}
            </span>

          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Production Code:{" "}
            <span className="font-semibold text-foreground">
              {production.code}
            </span>
          </p>

        </div>

        {/* Lifecycle Actions */}
        <div className="flex flex-wrap gap-2">

          {canEdit && production.status !== "ARCHIVED" && (
            <button
              type="button"
              onClick={() => {
                setUpdateError("")
                setIsEditModalOpen(true)
              }}
              disabled={isProcessing}
              className={`${buttonBase} border border-border bg-card hover:bg-accent`}
            >
              <Edit size={16} />
              Edit Production
            </button>
          )}

          {isOwner && production.status === "PLANNED" && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={isProcessing}
              className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <Play size={16} />
              Activate
            </button>
          )}

          {isOwner && production.status === "ACTIVE" && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isProcessing}
              className={`${buttonBase} bg-primary text-primary-foreground hover:opacity-90`}
            >
              <CheckCircle size={16} />
              Complete Production
            </button>
          )}

          {isOwner && production.status !== "ARCHIVED" && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={isProcessing}
              className={`${buttonBase} border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400`}
            >
              <Archive size={16} />
              Archive
            </button>
          )}

          {isOwner && production.status === "ARCHIVED" && (
            <button
              type="button"
              onClick={handleRestore}
              disabled={isProcessing}
              className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <RotateCcw size={16} />
              Restore Production
            </button>
          )}

        </div>
      </section>

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Production Overview */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">

        <div className="mb-7 flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clapperboard size={22} />
          </div>

          <div>
            <h2 className="font-semibold tracking-tight">
              Production Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Basic production information
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">

          {productionFields.map((field) => {
            const Icon = field.icon

            return (
              <div key={field.label} className="min-w-0">

                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {field.label !== "Production Name" &&
                    field.label !== "Production Code" && (
                      <Icon size={14} />
                    )}

                  {field.label}
                </p>

                {field.isStatus ? (
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusStyles[production.status] ||
                      "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {field.value}
                  </span>
                ) : (
                  <p className="mt-2 break-words text-sm font-semibold text-foreground sm:text-base">
                    {field.value}
                  </p>
                )}

              </div>
            )
          })}

        </div>
      </section>

      {/* Production Workspace */}
      <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 sm:p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground">
            <FolderIcon />
          </div>

          <div>
            <h2 className="font-semibold tracking-tight">
              Production Workspace
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Budget management, expenses, vendors, payments,
              outstanding amounts and financial reports will be
              available here as we develop the financial modules.
            </p>
          </div>

        </div>
      </section>

      {/* Edit Modal */}
      <EditProductionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isUpdating) {
            setIsEditModalOpen(false)
            setUpdateError("")
          }
        }}
        onSubmit={handleUpdateProduction}
        production={production}
        submitting={isUpdating}
        error={updateError}
      />

    </div>
  )
}

function FolderIcon() {
  return <Clapperboard size={19} />
}

export default ProductionDetails