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
  const fetchProduction = useCallback(async (showLoader = true) => {
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
  }, [id])

  useEffect(() => {
    fetchProduction()
  }, [fetchProduction])

  // Refresh both production details and the shared selector.
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

      // Production status must only be changed through lifecycle actions.
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

  // Activate planned production.
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

  // Complete active production.
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

  // Restore archived production.
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

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  }

  // Status styles.
  const getStatusStyle = (status) => {
    const styles = {
      ACTIVE:
        "bg-emerald-50 text-emerald-700 border-emerald-200",

      PLANNED:
        "bg-blue-50 text-blue-700 border-blue-200",

      COMPLETED:
        "bg-gray-100 text-gray-700 border-gray-200",

      ARCHIVED:
        "bg-amber-50 text-amber-700 border-amber-200",
    }

    return (
      styles[status] ||
      "bg-gray-100 text-gray-700 border-gray-200"
    )
  }

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw
          className="animate-spin text-gray-500"
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
          onClick={() => navigate("/productions")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to Productions
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!production) return null

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <button
            onClick={() => navigate("/productions")}
            className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Productions
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            {production.name}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Production Code: {production.code}
          </p>
        </div>

        {/* Lifecycle Actions */}
        <div className="flex flex-wrap gap-2">

          {/* Edit */}
          {canEdit && production.status !== "ARCHIVED" && (
            <button
              onClick={() => {
                setUpdateError("")
                setIsEditModalOpen(true)
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <Edit size={16} />
              Edit Production
            </button>
          )}

          {/* Activate */}
          {isOwner && production.status === "PLANNED" && (
            <button
              onClick={handleActivate}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play size={16} />
              Activate
            </button>
          )}

          {/* Complete */}
          {isOwner && production.status === "ACTIVE" && (
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle size={16} />
              Complete Production
            </button>
          )}

          {/* Archive */}
          {isOwner && production.status !== "ARCHIVED" && (
            <button
              onClick={handleArchive}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              <Archive size={16} />
              Archive
            </button>
          )}

          {/* Restore */}
          {isOwner && production.status === "ARCHIVED" && (
            <button
              onClick={handleRestore}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Restore Production
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Production Overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-3">
            <Clapperboard
              size={22}
              className="text-gray-700"
            />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Production Overview
            </h2>

            <p className="text-sm text-gray-500">
              Basic production information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Production Name
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {production.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Production Code
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {production.code}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Production Status
            </p>

            <span
              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                production.status
              )}`}
            >
              {production.status}
            </span>
          </div>

          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <CalendarDays size={14} />
              Start Date
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {formatDate(production.start_date)}
            </p>
          </div>

          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <CalendarDays size={14} />
              Expected End Date
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {formatDate(production.end_date)}
            </p>
          </div>

          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <Clock size={14} />
              Last Updated
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {production.updated_at
                ? new Date(
                    production.updated_at
                  ).toLocaleString("en-IN")
                : "Not available"}
            </p>
          </div>
        </div>
      </div>

      {/* Production Workspace */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <h2 className="font-semibold text-gray-800">
          Production Workspace
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Budget management, expenses, vendors, payments,
          outstanding amounts and financial reports will be
          available here as we develop the financial modules.
        </p>
      </div>

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

export default ProductionDetails