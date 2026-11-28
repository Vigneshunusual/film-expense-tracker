// This component loops through the summary data and renders the cards.


import { summaryCards } from "./dashboardData"
import SummaryCard from "./SummaryCard"
import "./Dashboard.css"

function FinancialSummary() {
  return (
    <section className="financial-summary">

      {summaryCards.map((card) => (
        <SummaryCard
          key={card.id}
          card={card}
        />
      ))}

    </section>
  )
}

export default FinancialSummary


// FinancialSummary.jsx doesn't contain any card styling or financial data. Its only job is to display the cards.