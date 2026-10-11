import { useEffect, useState } from "react"   //stores component data, and fetches invitation details when the page loads.
import { useParams } from "react-router-dom"   //Gets the invitation token from the URL.
import { useForm } from "react-hook-form"   //Manages form inputs, submission, and validation errors.
import { z } from "zod"  //defines validation rules using Zod.
import { zodResolver } from "@hookform/resolvers/zod" //connects Zod validation to React Hook Form.
import { Eye, EyeOff } from "lucide-react"  //Imports icons for showing and hiding passwords.

import {getInvitationDetails,acceptInvitation,} from "../services/authService" //Imports the API functions that fetch invitation details and submit the acceptance form to Django.

// 1. Zod validation schema
const invitationSchema = z.object({   //Defines the validation rules for the form fields.
    first_name: z
      .string()   //Requires a non-empty first name. .trim() removes surrounding spaces.
      .trim()
      .min(1, "First name is required"),

    last_name: z
      .string()
      .trim()
      .min(1, "Last name is required"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters"),

    password_confirm: z
      .string()
      .min(1, "Please confirm your password"),   //Requires the user to enter the confirmation password.
  })
  .refine(   //Adds a custom validation rule to the Zod schema.
    (data) => data.password === data.password_confirm,   //data contains all the form values being validated.  and  data.password is the password entered by the user. and data.password_confirm is the confirmation password. so, Checks that both passwords match. If they don't, the error is attached to password_confirm.
    { //the condition is false, Zod creates this validation error:
      message: "Passwords do not match",  //message specifies the error text.
      path: ["password_confirm"],  //path identifies which field receives the error.
    }
  )  //Since validation failed, React Hook Form does not call your onSubmit function, so the acceptance API request is not sent.If both passwords match, .refine() returns true, validation passes, and the form can proceed to onSubmit.

function AcceptInvitation() {
  const { token } = useParams()   //useparams=>reads dynamic parameters from the URL. and token=>stores the invitation token from the URL.

  // 2. State variables
  const [invitation, setInvitation] = useState(null)    //Stores the invitation details received from Django. Initially, there are no details, so the value is null.
  const [loading, setLoading] = useState(true)    //Tracks whether the invitation details are loading. Initially true.
  const [errorMessage, setErrorMessage] = useState("")  //Store error and success messages to display in the UI.
  const [successMessage, setSuccessMessage] = useState("")

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)   //Control the visibility of the password and confirmation password separately. false means hidden.
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 3.  React Hook Form configuration
  const {
    register,   //connects inputs to React Hook Form.
    handleSubmit,   //validates the form before calling your submission function.
    setValue,   //sets a field's value programmatically.
    reset,    //resets the form fields.
    formState: { errors, isSubmitting },   //errors=>contains validation errors. annd isSubmitting =>indicates whether form submission is in progress.
  } = useForm({
    resolver: zodResolver(invitationSchema),  //connects your Zod validation schema.
    defaultValues: {  //sets the initial values of editable fields.
      first_name: "",   
      last_name: "",
      password: "",
      password_confirm: "",
    },
  })

  // 4. Fetch invitation details
  useEffect(() => {    //runs the effect when the component mounts 
    const fetchInvitation = async () => {   //defines an asynchronous function to retrieve invitation details.
      try {
        setLoading(true)  //shows the loading state.
        setErrorMessage("")   //clears an earlier error.

        const data = await getInvitationDetails(token)  //Calls your API service to fetch invitation details from Django using the URL token.

        setInvitation(data)  //Stores the returned details in React state

        // Prefill names from the invitation(Prefills the first and last name fields using the invitation details. If a name is missing, it uses an empty string.)
        setValue("first_name", data.first_name || "")
        setValue("last_name", data.last_name || "")
      } 
      catch (error) {  //Runs if fetching the invitation fails and logs the error.
        console.error("Failed to fetch invitation:", error)

        const message =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "Unable to load this invitation. It may be invalid, expired, or already used."

        setErrorMessage(message)
      } 
      finally {
        setLoading(false)
      }
    }
    //This flow only fetches and displays invitation details. It does not create the account. Account creation happens later when the user submits the acceptance form.
    fetchInvitation()  //This calls the function that fetches invitation details from Django's API.
        //React gets the token from the invitation URL.
    // fetchInvitation() sends the token to Django.
    // Django checks whether the invitation exists, is pending, and hasn't expired.
    // Django returns the invitation details.
    // React stores the details using setInvitation(data) and prefills the first and last name fields using setValue().
  }, [token, setValue])
    //This is the dependency array of useEffect().
    // - token — if the invitation URL token changes, React runs the effect again to fetch the new invitation.
    // - setValue — this is the function provided by React Hook Form. Including it makes the effect's dependencies explicit; its identity is stable.
    //In your normal workflow: The effect runs when the component mounts and fetches the invitation details. The token usually stays the same, so it doesn't trigger another run.



  // 5. Submit acceptance form
  const onSubmit = async (formData) => {   //onSubmit — handles valid form submissions. and formdata->contains the validated form values.
    setErrorMessage("")  //Both message states are cleared before attempting acceptance.
    setSuccessMessage("")

    try {
      const response = await acceptInvitation(token, {   //Calls Django's acceptance API with the token and the user's editable form data.
        //We pass token because Django needs to know which invitation the user is accepting.
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password_confirm: formData.password_confirm,
      })

      setSuccessMessage(response.message ||"Your account has been created successfully.")

      // Clear all editable fields after success
      reset({
        first_name: "",
        last_name: "",
        password: "",
        password_confirm: "",
      })

      // Hide passwords if they were visible
      setShowPassword(false)
      setShowConfirmPassword(false)
    } 
    
    catch (error) {
      console.error("Invitation acceptance failed:", error)

      const responseData = error.response?.data

      const message =
        responseData?.detail ||
        responseData?.email?.[0] ||
        responseData?.password?.[0] ||
        responseData?.password_confirm?.[0] ||
        responseData?.first_name?.[0] ||
        responseData?.last_name?.[0] ||
        responseData?.non_field_errors?.[0] ||
        "Unable to accept the invitation. Please try again."

      setErrorMessage(message)
    }
  }

  // 6. Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600">
          Loading invitation...
        </p>
      </div>
    )
  }

  // 7. Invitation loading error
  if (errorMessage && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-center">
            Invitation Unavailable
          </h1>

          <p
            role="alert"
            className="mt-4 text-center text-red-600"
          >
            {errorMessage}
          </p>
        </div>
      </div>
    )
  }

  // 8. Invitation acceptance page
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center">
          Accept Invitation
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Complete your registration to join our organization.
        </p>

        {/* Acceptance form */}
        <form
          onSubmit={handleSubmit(onSubmit)}   //handleSubmit() runs first : comes from React Hook Form. It checks the form using your Zod schema.
                                                  //If validation fails, it displays validation errors and does not call onSubmit.
                                                  //If validation succeeds, it calls onSubmit(formData).
                                              //onSubmit() runs  =>Your function sends the token and validated form data to Django:</div>

          className="mt-8 space-y-5"
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
              type="text"
              autoComplete="given-name"
              {...register("first_name")}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.first_name.message}
              </p>
            )}
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
              type="text"
              autoComplete="family-name"
              {...register("last_name")}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.last_name.message}
              </p>
            )}
          </div>

          {/* Email - Read Only */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={invitation?.email || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border bg-gray-100 px-3 py-2 text-gray-600"
            />
          </div>

          {/* Organization - Read Only */}
          <div>
            <label
              htmlFor="organization"
              className="mb-1 block text-sm font-medium"
            >
              Organization
            </label>

            <input
              id="organization"
              type="text"
              value={invitation?.organization_name || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border bg-gray-100 px-3 py-2 text-gray-600"
            />
          </div>

          {/* Organization Role - Read Only */}
          <div>
            <label
              htmlFor="organization_role"
              className="mb-1 block text-sm font-medium"
            >
              Organization Role
            </label>

            <input
              id="organization_role"
              type="text"
              value={invitation?.role || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border bg-gray-100 px-3 py-2 text-gray-600"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password")}
                className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="password_confirm"
              className="mb-1 block text-sm font-medium"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="password_confirm"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password_confirm")}
                className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {errors.password_confirm && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password_confirm.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {successMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || Boolean(successMessage)}    //The button becomes disabled if either condition is true.
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting   //processing which is true-> then create acc and  succs msg true =>Invitation Accepted and both ture=>Acc invitaiton
              ? "Creating Account..."
              : successMessage
                ? "Invitation Accepted"
                : "Accept Invitation"}
          </button>

        </form>
      </div>
    </div>
  )
}

export default AcceptInvitation