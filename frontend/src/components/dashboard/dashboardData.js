// This file contains the dashboard's current illustrative data. Later, we'll replace it with real API data.


import {
  Wallet,
  Receipt,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

// Financial summary data
export const summaryCards = [
  {
    id: 1,
    title: "Total Planned Budget",
    amount: "₹5,00,00,000",
    note: "V2 - Finalized",
    icon: Wallet,
    type: "default",
  },
  {
    id: 2,
    title: "Actual Expenses",
    amount: "₹1,20,00,000",
    note: "24% of total budget",
    icon: Receipt,
    type: "success",
  },
  {
    id: 3,
    title: "Budget Remaining",
    amount: "₹3,80,00,000",
    note: "76% of budget remaining",
    icon: TrendingUp,
    type: "default",
  },
  {
    id: 4,
    title: "Pending Vendor Dues",
    amount: "₹15,50,000",
    note: "View 5 pending settlements",
    icon: AlertCircle,
    type: "warning",
  },
]

// Department utilization data
export const departments = [
  {
    name: "Camera & DOP",
    percentage: 85,
  },
  {
    name: "Location",
    percentage: 45,
  },
  {
    name: "Food & Catering",
    percentage: 110,
  },
]

// Recent transactions
export const transactions = [
  {
    id: 1,
    date: "Today",
    shootDay: "Shoot Day 25",
    description: "Crew Lunch & Dinner",
    department: "Food",
    amount: "₹50,000",
  },
  {
    id: 2,
    date: "Yesterday",
    shootDay: "Shoot Day 24",
    description: "Camera Equipment Rental",
    department: "Camera & DOP",
    amount: "₹1,25,000",
  },
  {
    id: 3,
    date: "Yesterday",
    shootDay: "Shoot Day 24",
    description: "Location Advance",
    department: "Location",
    amount: "₹75,000",
  },
]