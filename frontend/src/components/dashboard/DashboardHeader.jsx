// This contains:
// - Financial Dashboard title
// - Search input
// - Vendor Payment button
// - Add Expense button


import { Plus, Search } from "lucide-react"

import "./Dashboard.css"

function DashboardHeader({ userName, searchQuery, setSearchQuery }) 
{


  return (
    <section className="dashboard-header">

      {/* Heading */}
      <div className="dashboard-heading">

        <h1>
          Welcome, {userName} 👋
        </h1>

        <p>
          Monitor your production finances, budgets and vendor payments.
        </p>

      </div>

      {/* Search and Actions */}
      <div className="dashboard-header-actions">

        {/* Search */}
        <div className="dashboard-search">

          <Search size={17} />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search dashboard transactions..."
            aria-label="Search dashboard transactions"
          />

        </div>

        {/* Buttons */}
        <div className="dashboard-action-buttons">

          <button
            type="button"
            disabled
            title="Vendor Payments module is not connected yet"
            className="vendor-payment-button"
          >
            <Plus size={17} />
            Vendor Payment
          </button>

          <button
            type="button"
            disabled
            title="Expenses module is not connected yet"
            className="add-expense-button"
          >
            <Plus size={17} />
            Add Expense
          </button>

        </div>

      </div>

    </section>
  )
}

export default DashboardHeader