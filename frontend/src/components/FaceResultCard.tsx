interface FaceResultCardProps {
  nombre?: string;
  similitud?: number;
  distancia?: number;
  confianza?: number;
  probabilidadCalibrada?: number;
  coincide?: boolean;
  umbral?: number;

  // Métricas del modelo de Machine Learning
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
}

function FaceResultCard({
  nombre,
  similitud,
  distancia,
  confianza,
  probabilidadCalibrada,
  coincide,
  umbral,
  accuracy,
  precision,
  recall,
  f1Score,
}: FaceResultCardProps) {
  const formatPercent = (value?: number) => {
    if (value === undefined) {
      return "No disponible";
    }

    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value?: number) => {
    if (value === undefined) {
      return "No disponible";
    }

    return value.toFixed(4);
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Resultado del análisis
          </h2>

          <p style={styles.subtitle}>
            Resultados generados por el modelo de IA
          </p>
        </div>

        {coincide !== undefined && (
          <span
            style={{
              ...styles.badge,
              backgroundColor: coincide
                ? "#dcfce7"
                : "#fee2e2",
              color: coincide
                ? "#166534"
                : "#991b1b",
            }}
          >
            {coincide
              ? "Coincidencia"
              : "No coincidencia"}
          </span>
        )}
      </div>

      <div style={styles.personBox}>
        <span style={styles.label}>
          Resultado identificado
        </span>

        <h3 style={styles.personName}>
          {nombre || "Resultado no identificado"}
        </h3>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Resultados del análisis
        </h3>

        <div style={styles.metrics}>
          <Metric
            label="Similitud"
            value={formatPercent(similitud)}
          />

          <Metric
            label="Confianza"
            value={formatPercent(confianza)}
          />

          <Metric
            label="Distancia"
            value={formatNumber(distancia)}
          />

          <Metric
            label="Umbral"
            value={formatNumber(umbral)}
          />

          <Metric
            label="Probabilidad calibrada"
            value={formatPercent(
              probabilidadCalibrada
            )}
          />
        </div>
      </div>

      {(accuracy !== undefined ||
        precision !== undefined ||
        recall !== undefined ||
        f1Score !== undefined) && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Métricas del modelo de Machine Learning
          </h3>

          <div style={styles.metrics}>
            <Metric
              label="Accuracy"
              value={formatPercent(accuracy)}
            />

            <Metric
              label="Precision"
              value={formatPercent(precision)}
            />

            <Metric
              label="Recall"
              value={formatPercent(recall)}
            />

            <Metric
              label="F1-Score"
              value={formatPercent(f1Score)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div style={styles.metric}>
      <span style={styles.label}>
        {label}
      </span>

      <strong style={styles.value}>
        {value}
      </strong>
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    color: "#1e293b",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },

  title: {
    margin: "0 0 6px",
    fontSize: "21px",
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },

  badge: {
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap" as const,
  },

  personBox: {
    background: "#f8fafc",
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "22px",
  },

  personName: {
    margin: 0,
    fontSize: "20px",
  },

  section: {
    marginTop: "20px",
  },

  sectionTitle: {
    fontSize: "16px",
    marginBottom: "12px",
  },

  metrics: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },

  metric: {
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  label: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "7px",
  },

  value: {
    fontSize: "17px",
    color: "#1e293b",
  },
};

export default FaceResultCard;