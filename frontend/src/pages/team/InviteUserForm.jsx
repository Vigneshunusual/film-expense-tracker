
import { useState } from "react"
import { createInvitation } from "../../services/authService"

function InviteUserForm() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "MANAGER",
  })

  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle input changes.
  const handleChange = (event) => {
    const { name, value } = event.target

    setSuccessMessage("")
    setErrorMessage("")

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  // Submit invitation.
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      // Send invitation to Django.
      const invitation = await createInvitation(formData)

      setSuccessMessage(
        `Invitation created successfully for ${invitation.email}.`
      )

      // Reset form after successful invitation.
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        role: "MANAGER",
      })
    } catch (error) {
      console.error("Failed to create invitation:", error)

      const responseData = error.response?.data

      const message =
        responseData?.detail ||
        responseData?.email?.[0] ||
        responseData?.role?.[0] ||
        responseData?.first_name?.[0] ||
        responseData?.last_name?.[0] ||
        responseData?.non_field_errors?.[0] ||
        "Failed to create invitation. Please try again."

      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm">

      {/* Heading */}
      <h2 className="text-2xl font-bold">
        Invite Organization User
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Invite a Manager or Accountant to join your organization.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {/* Invitation Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >

        {/* First Name */}
        <div>
          <label
            htmlFor="first_name"
            className="mb-1 block text-sm font-medium"
          >
            First Name
          </label>

          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            autoComplete="given-name"
            required
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="last_name"
            className="mb-1 block text-sm font-medium"
          >
            Last Name
          </label>

          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            autoComplete="family-name"
            required
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium"
          >
            Email Address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Organization Role */}
        <div>
          <label
            htmlFor="role"
            className="mb-1 block text-sm font-medium"
          >
            Organization Role
          </label>

          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MANAGER">
              Manager
            </option>

            <option value="ACCOUNTANT">
              Accountant
            </option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Sending Invitation..."
            : "Send Invitation"}
        </button>

      </form>
    </div>
  )
}

export default InviteUserForm
