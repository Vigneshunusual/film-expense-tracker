// This component displays one financial summary card.

// We reuse it four times instead of writing the same JSX four times.


import "./Dashboard.css"

function SummaryCard({ card }) {
  const Icon = card.icon

  return (
    <article className={`summary-card ${card.type}`}>

      <div className="summary-card-header">

        <p className="summary-card-title">
          {card.title}
        </p>

        <div className="summary-card-icon">
          <Icon size={18} />
        </div>

      </div>

      <h2 className="summary-card-amount">
        {card.amount}
      </h2>

      <p className="summary-card-note">
        {card.note}
      </p>

      {card.id === 3 && (
        <div className="summary-progress">
          <div className="summary-progress-fill" />
        </div>
      )}

    </article>
  )
}

export default SummaryCard