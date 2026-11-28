// This component has two layouts:
// - Mobile: compact transaction cards.
// - Laptop: professional data table.


import { transactions } from "./dashboardData"

import "./Dashboard.css"

function RecentTransactions({ searchQuery }) {

  const filteredTransactions = transactions.filter((transaction) => {

    const searchText = [
      transaction.description,
      transaction.department,
      transaction.date,
      transaction.shootDay,
      transaction.amount,
    ]
      .join(" ")
      .toLowerCase()

    return searchText.includes(searchQuery.toLowerCase())
  })

  return (
    <section className="transactions-panel">

      {/* Header */}
      <div className="transactions-header">

        <div>

          <h2>
            Recent Transactions
          </h2>

          <p>
            Latest production expenses and financial activity
          </p>

        </div>

        <span>
          {filteredTransactions.length} records
        </span>

      </div>

      {/* Mobile Cards */}
      <div className="mobile-transactions">

        {filteredTransactions.length > 0 ? (

          filteredTransactions.map((transaction) => (

            <article
              key={transaction.id}
              className="mobile-transaction-card"
            >

              <div>

                <h3>
                  {transaction.description}
                </h3>

                <p>
                  {transaction.department} · {transaction.shootDay}
                </p>

                <span>
                  {transaction.date}
                </span>

              </div>

              <strong>
                {transaction.amount}
              </strong>

            </article>

          ))

        ) : (

          <p className="no-transactions">
            No transactions match your search.
          </p>

        )}

      </div>

      {/* Desktop Table */}
      <div className="desktop-transactions">

        <table>

          <thead>
            <tr>
              <th>Date / Context</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>

            {filteredTransactions.length > 0 ? (

              filteredTransactions.map((transaction) => (

                <tr key={transaction.id}>

                  <td>
                    <strong>{transaction.date}</strong>

                    <span>{transaction.shootDay}</span>
                  </td>

                  <td>
                    <strong>{transaction.description}</strong>

                    <span>
                      Dept: {transaction.department}
                    </span>
                  </td>

                  <td className="transaction-amount">
                    {transaction.amount}
                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="3" className="no-transactions">
                  No transactions match your search.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </section>
  )
}

export default RecentTransactions