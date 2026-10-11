import { useState } from "react"   //stores and updates form data and messages.
import { createInvitation } from "../services/authService"   //sends the invitation data to Django through your API service.

function InviteStaffForm() {
 //Defines the React component.
    const [formData, setFormData] = useState({  //formData — stores the current form values. and setFormData — updates those values.
    first_name: "",
    last_name: "",   //The names and email start empty.
    email: "",
    role: "MEMBER",  //The default role is "MEMBER".
  })
    
    //Both initially contain an empty string, so neither message appears.
    const [successMessage, setSuccessMessage] = useState("")   //displays a success message after invitation creation.
    const [errorMessage, setErrorMessage] = useState("")   //displays an error if creation fails.

    const handleChange = (event) => {   //event — the input change event.
        const { name, value } = event.target    //event.target — the input or dropdown that changed.
             //name — its name attribute. and  value — its current value.
        setFormData((previousData) => ({   //the previous form state.
            ...previousData,   //preserves all existing fields.
            [name]: value,  //updates only the field that changed.
        }))  //For example, typing Arun into the first-name input updates first_name without clearing the email or role.
    }
    
    const handleSubmit = async (event) => //Defines an asynchronous function because the API request takes time.
    {
        event.preventDefault()   //Prevents the browser's default form submission and page reload.

        //Clears any previous success or error message before trying again.
        setSuccessMessage("")
        setErrorMessage("")
        //Send the API request:
        try {
            const invitation = await createInvitation(formData)   //form data is our data whch will be send to backend.(sends the form values to the backend.) and stores the returned response data in our invitation variable.
            console.log("Invitation created successfully:", invitation)
            setSuccessMessage(`Invitation created for ${invitation.email}.`)  //Invitation created for arun@gmail.com.
            //Resets the form after successful creation so Nishok can invite another person.
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                role: "MEMBER",
            })
        }
        //If the API request fails, this block runs and logs the error.
        catch (error) {
            console.error("Failed to create invitation:", error)
            const responseData = error.response?.data  //Gets the response body from Django, if one exists. The ?. optional chaining prevents an error if part of the response is missing.
            const message =
                responseData?.detail ||
                responseData?.email?.[0] ||
                responseData?.role?.[0] ||
                responseData?.first_name?.[0] ||
                "Failed to create invitation. Please try again."
            setErrorMessage(message)
        }
    }

    return (

        <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Invite Staff</h2>
        <p className="mt-2 text-sm text-gray-500">Invite a team member to join our organization.</p>

        {/* Success Message */}
        {successMessage && (   //if success msg true then && will execute. it renders the message only when it is not empty.
            <div
                role="status"
                className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
                {successMessage}  
            </div>
        )}

        {/* //Error Message:  Uses the same conditional-rendering idea, but displays errors in red. role="alert" helps announce the error to assistive technologies. */}
        {errorMessage && (
            <div
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
                {errorMessage}
            </div>
        )}

        {/* Invitation Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* First Name */}
            <div>
            <label
                htmlFor="first_name"   //htmlFor connects the label to the input's matching id.
                className="mb-1 block text-sm font-medium"
            >
                First Name
            </label>

            <input
                id="first_name"  //identifies the input and connects it to the label.
                name="first_name"  //tells handleChange which state field to update.
                type="text"    //accepts text
                value={formData.first_name}    //displays the value from React state.
                onChange={handleChange}   //updates the state when the user types.
                required   //browser validation requires a value.
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
                    <option value="MANAGER">Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="MEMBER">Member</option>
                </select>
            </div>

            {/* Submit Button */}
            <button
                type="submit"   //type="submit" — submits the form and triggers handleSubmit.
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
                Create Invitation
            </button>
        </form>
    </div>
    )
 
}

export default InviteStaffForm