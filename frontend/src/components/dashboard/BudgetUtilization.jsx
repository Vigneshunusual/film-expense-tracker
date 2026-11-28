// This displays the department-wise budget usage.

import { departments } from "./dashboardData"

import "./Dashboard.css"

function BudgetUtilization() {
  return (
    <article className="dashboard-panel">

      <div className="panel-header">

        <h2>
          Budget Utilization
        </h2>

        <span>
          By Dept
        </span>

      </div>

      <div className="department-list">

        {departments.map((department) => {

          const isOverBudget = department.percentage > 100

          const progressWidth = Math.min(
            department.percentage,
            100
          )

          return (
            <div
              key={department.name}
              className="department-item"
            >

              <div className="department-info">

                <span>
                  {department.name}
                </span>

                <strong className={isOverBudget ? "over-budget" : ""}>
                  {department.percentage}%
                </strong>

              </div>

              <div
                className="department-progress"
                role="progressbar"
                aria-label={`${department.name} budget utilization`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressWidth}
              >

                <div
                  className={`department-progress-fill ${
                    isOverBudget ? "danger" : ""
                  }`}
                  style={{
                    width: `${progressWidth}%`,
                  }}
                />

              </div>

              {isOverBudget && (
                <p className="budget-warning">
                  Budget exceeded
                </p>
              )}

            </div>
          )
        })}

      </div>

    </article>
  )
}

export default BudgetUtilization