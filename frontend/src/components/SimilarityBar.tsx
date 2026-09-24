interface SimilarityBarProps {
  value: number;
}

function SimilarityBar({
  value,
}: SimilarityBarProps) {
  const percentage = Math.max(
    0,
    Math.min(value * 100, 100)
  );

  return (
    <div className="similarity-container">

      <div className="similarity-header">
        <span>Similitud</span>

        <strong>
          {percentage.toFixed(2)}%
        </strong>
      </div>

      <div className="similarity-track">
        <div
          className="similarity-fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

    </div>
  );
}

export default SimilarityBar;