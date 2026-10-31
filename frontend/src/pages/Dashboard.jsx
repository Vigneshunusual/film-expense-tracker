
import { useEffect } from "react"
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Receipt,
  AlertCircle,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"
import { getCurrentOrganization } from "../services/authService"

const summaryCards = [
  {
    title: "Total Planned Budget",
    amount: "₹5,00,00,000",
    note: "V2 - Finalized",
    icon: Wallet,
    color: "text-foreground",
  },
  {
    title: "Actual Expenses",
    amount: "₹1,20,00,000",
    note: "24% of total budget",
    icon: Receipt,
    color: "text-emerald-500",
  },
  {
    title: "Budget Remaining",
    amount: "₹3,80,00,000",
    note: "76% of budget remaining",
    icon: TrendingUp,
    color: "text-foreground",
  },
  {
    title: "Pending Vendor Dues",
    amount: "₹15,50,000",
    note: "View 5 pending settlements",
    icon: AlertCircle,
    color: "text-amber-500",
  },
]

const departments = [
  { name: "Camera & DOP", percentage: 85, color: "bg-amber-500" },
  { name: "Location", percentage: 45, color: "bg-emerald-500" },
  { name: "Food & Catering", percentage: 110, color: "bg-red-500" },
]

const transactions = [
  {
    date: "Today",
    shootDay: "Shoot Day 25",
    description: "Crew Lunch & Dinner",
    department: "Food",
    amount: "₹50,000",
  },
  {
    date: "Yesterday",
    shootDay: "Shoot Day 24",
    description: "Camera Equipment Rental",
    department: "Camera & DOP",
    amount: "₹1,25,000",
  },
  {
    date: "Yesterday",
    shootDay: "Shoot Day 24",
    description: "Location Advance",
    department: "Location",
    amount: "₹75,000",
  },
]

function ExpenseTrendChart() {
  return (
    <div className="mt-5 w-full">
      <svg
        viewBox="0 0 700 200"
        role="img"
        aria-label="Illustrative expense trend over seven shoot days"
        className="h-[220px] w-full overflow-visible sm:h-[260px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <path
          d="M0 165 C55 145 80 100 130 115 S205 170 260 120 S340 55 390 35 S470 20 500 85 S540 210 580 195 S650 65 700 30 L700 200 L0 200 Z"
          fill="url(#expenseFill)"
        />

        <path
          d="M0 165 C55 145 80 100 130 115 S205 170 260 120 S340 55 390 35 S470 20 500 85 S540 210 580 195 S650 65 700 30"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        {["Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25"].map(
          (day) => (
            <span key={day}>{day}</span>
          )
        )}
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const organization = await getCurrentOrganization()
        console.log("Organization:", organization)
      } catch (error) {
        console.error("Organization request failed:", error)
      }
    }

    loadOrganization()
  }, [])

  return (
    <div className="min-h-full space-y-6 bg-background text-foreground">
      {/* Page heading and actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shoot Day 25 · 16 September 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            title="Available when the Vendor Payments module is connected"
            className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium opacity-80 sm:px-4"
          >
            <Plus size={16} />
            Vendor Payment
          </button>

          <button
            type="button"
            disabled
            title="Available when the Expenses module is connected"
            className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white opacity-80 sm:px-4"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Financial summary cards */}
      <section
        aria-label="Financial summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        {summaryCards.map((card, index) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className={`min-w-0 rounded-xl border bg-card p-4 sm:p-5 ${
                index === 3 ? "border-amber-500/40" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <Icon size={17} className={card.color} />
              </div>

              <p
                className={`mt-2 break-words text-2xl font-bold tracking-tight sm:text-[28px] ${card.color}`}
              >
                {card.amount}
              </p>

              <p
                className={`mt-2 text-xs ${
                  index === 3
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              >
                {card.note}
              </p>

              {index === 2 && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[24%] rounded-full bg-emerald-500" />
                </div>
              )}
            </article>
          )
        })}
      </section>

      {/* Expense trend and department utilization */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <article className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">
              Expense Trend (Last 7 Shoot Days)
            </h2>
            <span className="text-xs text-muted-foreground">
              Illustrative
            </span>
          </div>

          <ExpenseTrendChart />
        </article>

        <article className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Budget Utilization</h2>
            <span className="text-xs text-muted-foreground">By Dept</span>
          </div>

          <div className="mt-5 space-y-6">
            {departments.map((department) => {
              const isOverBudget = department.percentage > 100
              const barWidth = Math.min(department.percentage, 100)

              return (
                <div key={department.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span>{department.name}</span>
                    <span
                      className={
                        isOverBudget
                          ? "font-semibold text-red-500"
                          : "font-semibold"
                      }
                    >
                      {department.percentage}%
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${department.name} budget utilization`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={barWidth}
                  >
                    <div
                      className={`h-full rounded-full ${department.color}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {isOverBudget && (
                    <p className="mt-1 text-xs text-red-500">
                      Budget exceeded
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </article>
      </section>

      {/* Recent transactions */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">Recent Transactions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Illustrative entries — not live financial records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-5">
                  Date / Context
                </th>
                <th className="px-4 py-3 font-medium sm:px-5">
                  Description
                </th>
                <th className="px-4 py-3 text-right font-medium sm:px-5">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction, index) => (
                <tr
                  key={`${transaction.description}-${index}`}
                  className="border-t border-border transition-colors hover:bg-accent/40"
                >
                  <td className="px-4 py-4 sm:px-5">
                    <p className="font-medium">{transaction.date}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transaction.shootDay}
                    </p>
                  </td>

                  <td className="px-4 py-4 sm:px-5">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dept: {transaction.department}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-right font-semibold sm:px-5">
                    {transaction.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Signed in as {user?.first_name || user?.email || "User"}. Financial
        figures shown above are sample values for layout development.
      </p>
    </div>
  )
}

export default Dashboard
