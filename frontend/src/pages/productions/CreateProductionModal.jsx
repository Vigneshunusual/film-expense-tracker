
import { useState } from "react"
import { X, Clapperboard, Loader2, AlertCircle } from "lucide-react"

const initialFormData = {
  name: "",
  code: "",
  status: "PLANNED",
  start_date: "",
  end_date: "",
}

function CreateProductionModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  error,
}) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: name === "code" ? value.toUpperCase() : value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Production name is required."
    }

    if (!formData.code.trim()) {
      newErrors.code = "Production code is required."
    }

    if (!formData.start_date) {
      newErrors.start_date = "Start date is required."
    }

    if (
      formData.end_date &&
      formData.start_date &&
      formData.end_date < formData.start_date
    ) {
      newErrors.end_date = "End date cannot be before start date."
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) return

    await onSubmit({
      ...formData,
      name: formData.name.trim(),
      code: formData.code.trim(),
      end_date: formData.end_date || null,
    })
  }

  const handleClose = () => {
    if (submitting) return

    setFormData(initialFormData)
    setErrors({})
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-production-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clapperboard size={22} />
            </div>

            <div>
              <h2
                id="create-production-title"
                className="text-lg font-semibold"
              >
                Create Production
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add a new film production to your organization.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">

            {/* Backend error */}
            {error && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Production Name */}
            <div>
              <label
                htmlFor="production-name"
                className="mb-2 block text-sm font-medium"
              >
                Production Name <span className="text-destructive">*</span>
              </label>

              <input
                id="production-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Project Sunrise"
                maxLength={150}
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {errors.name && (
                <p className="mt-1.5 text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Production Code */}
            <div>
              <label
                htmlFor="production-code"
                className="mb-2 block text-sm font-medium"
              >
                Production Code <span className="text-destructive">*</span>
              </label>

              <input
                id="production-code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. PRJ-001"
                maxLength={30}
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {errors.code && (
                <p className="mt-1.5 text-xs text-destructive">
                  {errors.code}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="production-status"
                className="mb-2 block text-sm font-medium"
              >
                Production Status
              </label>

              <select
                id="production-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="production-start-date"
                  className="mb-2 block text-sm font-medium"
                >
                  Start Date <span className="text-destructive">*</span>
                </label>

                <input
                  id="production-start-date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {errors.start_date && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {errors.start_date}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="production-end-date"
                  className="mb-2 block text-sm font-medium"
                >
                  End Date
                </label>

                <input
                  id="production-end-date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date || undefined}
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {errors.end_date && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Fields marked with * are required. End date is optional.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {submitting ? "Creating..." : "Create Production"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CreateProductionModal
