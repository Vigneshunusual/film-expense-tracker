import { Route, Routes } from "react-router-dom"

import Register from "./pages/Register"
import Login from "./pages/Login"
import AcceptInvitation from "./pages/AcceptInvitation"
import ProtectedRoute from "./components/ProtectedRoute"
import Dashboard from "./pages/Dashboard"
import DashboardLayout from "./layouts/DashboardLayout"
import ProductionList from "./pages/productions/ProductionList"
import ProductionDetails from "./pages/productions/ProductionDetails"

function App() {
return ( 
<Routes>

  {/* Public Routes */}
  <Route path="/register" element={<Register />} />
  <Route path="/login" element={<Login />} />
  <Route path="/invitations/:token"element={<AcceptInvitation />}/>

  {/* Protected Routes */}
  <Route element={<ProtectedRoute />}>
    {/* Shared Dashboard Layout */}
    <Route element={<DashboardLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Production Management */}
      <Route path="/productions" element={<ProductionList />} />
      <Route path="/productions/:id" element={<ProductionDetails />} />
    </Route>
  </Route>
</Routes>
)
}

export default App;
