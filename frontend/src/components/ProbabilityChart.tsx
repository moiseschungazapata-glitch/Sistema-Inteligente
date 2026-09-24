interface ProbabilityChartProps {
  probability: number;
}

function ProbabilityChart({
  probability,
}: ProbabilityChartProps) {
  const percentage = Math.max(
    0,
    Math.min(probability * 100, 100)
  );

  return (
    <div className="probability-chart">

      <div className="probability-value">
        <strong>
          {percentage.toFixed(2)}%
        </strong>

        <span>
          Probabilidad estimada
        </span>
      </div>

      <div className="probability-bar">

        <div
          className="probability-fill"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

export default ProbabilityChart;