
import {Route,Routes} from "react-router-dom"; 

import Register from "./pages/Register";
import Login from"./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute"
import Dashboard from "./pages/Dashboard";



function App() {
  return (
    
    <Routes>

      {/* Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

    </Routes>
    
  )
}

export default App