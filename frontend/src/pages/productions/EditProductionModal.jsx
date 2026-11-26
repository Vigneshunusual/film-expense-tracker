import { useEffect, useState } from "react"
import { X, Clapperboard, Loader2, AlertCircle } from "lucide-react"

function EditProductionModal({
  isOpen,
  onClose,
  onSubmit,
  production,
  submitting,
  error,
}) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    start_date: "",
    end_date: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && production) {
      setFormData({
        name: production.name || "",
        code: production.code || "",
        start_date: production.start_date || "",
        end_date: production.end_date || "",
      })

      setErrors({})
    }
  }, [isOpen, production])

  if (!isOpen || !production) return null

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
      name: formData.name.trim(),
      code: formData.code.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date || null,
    })
  }

  const handleClose = () => {
    if (!submitting) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-production-title"
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
                id="edit-production-title"
                className="text-lg font-semibold"
              >
                Edit Production
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Update production information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
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
                htmlFor="edit-production-name"
                className="mb-2 block text-sm font-medium"
              >
                Production Name *
              </label>

              <input
                id="edit-production-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={255}
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Production Code */}
            <div>
              <label
                htmlFor="edit-production-code"
                className="mb-2 block text-sm font-medium"
              >
                Production Code *
              </label>

              <input
                id="edit-production-code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                maxLength={50}
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {errors.code && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.code}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-production-start"
                  className="mb-2 block text-sm font-medium"
                >
                  Start Date *
                </label>

                <input
                  id="edit-production-start"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {errors.start_date && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.start_date}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-production-end"
                  className="mb-2 block text-sm font-medium"
                >
                  Expected End Date
                </label>

                <input
                  id="edit-production-end"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date || undefined}
                  disabled={submitting}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {errors.end_date && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Production status can only be changed using lifecycle actions.
              Fields marked with * are required.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default EditProductionModal