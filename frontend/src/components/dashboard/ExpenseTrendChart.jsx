import "./Dashboard.css"

function ExpenseTrendChart() {
  const days = [
    "Day 19",
    "Day 20",
    "Day 21",
    "Day 22",
    "Day 23",
    "Day 24",
    "Day 25",
  ]

  return (
    <article className="dashboard-panel">

      <div className="panel-header">

        <h2>
          Expense Trend (Last 7 Shoot Days)
        </h2>

        <span>
          Illustrative
        </span>

      </div>

      <div className="expense-chart">

        <svg
          viewBox="0 0 700 200"
          role="img"
          aria-label="Illustrative expense trend over seven shoot days"
          preserveAspectRatio="none"
        >

          <defs>
            <linearGradient
              id="expenseFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#10b981"
                stopOpacity="0.42"
              />

              <stop
                offset="100%"
                stopColor="#10b981"
                stopOpacity="0.08"
              />
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

      </div>

      <div className="chart-days">

        {days.map((day) => (
          <span key={day}>
            {day}
          </span>
        ))}

      </div>

    </article>
  )
}

export default ExpenseTrendChart