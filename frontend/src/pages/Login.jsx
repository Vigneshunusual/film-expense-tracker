import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginUser } from "../services/authService"     //Sends the login data to Django.
import { useAuth } from "../context/AuthContext"     //Gives access to our global authentication state.
 

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

function Login() {
  const navigate = useNavigate()
  const {register,handleSubmit,formState: { errors }} = useForm({resolver: zodResolver(loginSchema)})
  const { login } = useAuth()  //Gets the login() function from AuthContext.

  const onSubmit = async (data) => {
    try {
      const response = await loginUser(data)
      login(response)  //This calls your AuthContext: (updates React's authentication state)
      console.log("Login successful:", response)
      navigate("/dashboard")   //After successful login → go to Dashboard.
    } 
    catch (error) {
      console.error("Login failed:", error)
      console.error("Backend response:", error.response?.data)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border rounded-xl p-8 shadow-sm">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome Back 
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your Film Tracker account
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </button>

        </form>

      </div>
    </div>
  )
}

export default Login