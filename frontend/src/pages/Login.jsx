import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import {useState} from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { loginUser } from "../services/authService"     //Sends the login data to Django.
import { useAuth } from "../context/AuthContext"     //Gives access to our global authentication state.
import { Eye, EyeOff } from "lucide-react"
 
// Zod validation
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

function Login() {
  const navigate = useNavigate()

  // Controls whether the password is visible
  const [showPassword, setShowPassword] = useState(false)

  // Stores API errors that should be displayed to the user
  const [loginError, setLoginError] = useState("")

  const {register,handleSubmit,formState: { errors,isSubmitting }} = useForm({resolver: zodResolver(loginSchema)})
  const { login } = useAuth()  //Gets the login() function from AuthContext.

  const onSubmit = async (data) => {
    

    // Clear the previous API error before retrying
    setLoginError("")
    
    try {
      const response = await loginUser(data)
      login(response)  //This calls your AuthContext: (updates React's authentication state)
      console.log("Login successful:", response)
      navigate("/dashboard")   //After successful login → go to Dashboard.
    } 
    catch (error) 
    {
      console.error("Login failed:", error)
    
      const status=error.response?.status
      const backendMessage = error.response?.data?.detail

      if (status === 401 || status === 400) {
        setLoginError("Invalid email or password.")
      } 
      else if (backendMessage && status < 500) {
        setLoginError(backendMessage)
      } 
      else {
        setLoginError("Unable to log in right now. Please try again.")
      }
    }
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border rounded-xl p-8 shadow-sm">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold ">
            Welcome Back 
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your Film Tracker account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}className="space-y-5" noValidate>
          {/* API error message */}
          {loginError &&(
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {loginError}
            </div>
          )}



          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              {...register("email")}
              onChange={(event)=>{
                register("email").onChange(event)
                setLoginError("")
              }}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "email-error" : undefined
              }
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register("password")}
                onChange={(event)=>{
                  register("password").onChange(event)
                  setLoginError("")
                }}
                className="w-full border rounded-lg px-4 py-3 pr-16 outline-none focus:ring-2 focus:ring-black"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />

              {/* Password visibility button */}
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 hover:text-black"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (<EyeOff size={20} />) : (<Eye size={20} />)}
              </button>
            </div>    
            
            {errors.password && (
              <p id="password-error" className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}  

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
          >{isSubmitting ? "Logging in..." : "Login"}
            
          </button>

        </form>

      </div>
    </div>
  )
}

export default Login