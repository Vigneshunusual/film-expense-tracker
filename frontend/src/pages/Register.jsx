//React Hook Form is a library that helps us create and manage forms in React.
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerUser } from "../services/authService"

import { useNavigate } from "react-router-dom"

const registerSchema = z.object({
  
  first_name: z.string().min(1, "First name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organization_name: z.string().min(1, "Organization name is required"),
})

function Register() {
  const navigate = useNavigate()
  const {register,handleSubmit,formState: { errors },} = useForm({resolver: zodResolver(registerSchema),})

  const onSubmit = async (data) => {
  try {
    const response = await registerUser(data)
    console.log("Registration successful:", response)
    alert("Registration successful! Please login.")
    navigate("/login")
  } 
  
  catch (error) {
    console.error("Registration failed:", error)
    console.error("Backend response:", error.response?.data)
  }
}
  

 

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6">

        <div>
          <h1 className="text-2xl font-bold center text-center">
            Registration
          </h1>

          <p className="text-sm text-muted-foreground center text-center">
            Create your Film Tracker organization account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="text-sm font-medium">
              First Name
            </label>

            <input
              {...register("first_name")}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter your first name"
            />

            {errors.first_name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Email
            </label>

            <input
              {...register("email")}
              type="email"
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter your email"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Password
            </label>

            <input
              {...register("password")}
              type="password"
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter your password"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Organization Name
            </label>

            <input
              {...register("organization_name")}
              className="mt-1 w-full rounded-md border px-3x py-2"
              placeholder="Enter organization name"
            />

            {errors.organization_name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.organization_name.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Create Account
          </button>

        </form>
      </div>
    </div>
  )
}

export default Register