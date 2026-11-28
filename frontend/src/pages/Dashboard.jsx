// File	Responsibility
// Dashboard.jsx	Combines all dashboard components
// DashboardHeader.jsx	Title, search and action buttons
// FinancialSummary.jsx	Displays four financial cards
// SummaryCard.jsx	Reusable individual card
// ExpenseTrendChart.jsx	Expense trend chart
// BudgetUtilization.jsx	Department budget progress
// RecentTransactions.jsx	Recent financial transactions
// dashboardData.js	Dashboard display data
// Dashboard.css	Dashboard styling and responsiveness


// It only connects the components.

import { useState } from "react"

import { useAuth } from "../context/AuthContext"

import DashboardHeader from "../components/dashboard/DashboardHeader"

import FinancialSummary from "../components/dashboard/FinancialSummary"

import ExpenseTrendChart from "../components/dashboard/ExpenseTrendChart"

import BudgetUtilization from "../components/dashboard/BudgetUtilization"

import RecentTransactions from "../components/dashboard/RecentTransactions"

import "../components/dashboard/Dashboard.css"

function Dashboard() {
  

  const { user } = useAuth()
  const userName = user?.first_name || user?.username || user?.email?.split("@")[0] || "there"
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="dashboard-page">

      {/* Dashboard Header */}
      <DashboardHeader
        userName={userName}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Financial Summary */}
      <FinancialSummary />

      {/* Charts */}
      <section className="dashboard-charts">

        <ExpenseTrendChart />

        <BudgetUtilization />

      </section>

      {/* Recent Transactions */}
      <RecentTransactions
        searchQuery={searchQuery}
      />

      {/* Footer */}
      <p className="dashboard-footer">
        Signed in as {user?.email || "Authenticated User"}.
        Financial figures are illustrative sample data.
      </p>

    </div>
  )
}

export default Dashboard