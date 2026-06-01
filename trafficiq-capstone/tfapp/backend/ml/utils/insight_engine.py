from apps.insights.models import Insight
from datetime import datetime


class InsightEngine:
    """Analyze forecast data and generate actionable AI insights."""

    PEAK_THRESHOLD = 0.8  # top 80th percentile = peak

    def __init__(self, prediction):
        self.prediction = prediction
        self.data = prediction.forecast_data

    def generate(self):
        if not self.data:
            return []

        insights = []
        values = [d["predicted"] for d in self.data]
        max_val = max(values) if values else 1
        p80 = sorted(values)[int(len(values) * 0.8)]

        # Peak hour detection
        peaks = [d for d in self.data if d["predicted"] >= p80]
        if peaks:
            peak = max(peaks, key=lambda x: x["predicted"])
            insights.append(Insight.objects.create(
                prediction=self.prediction,
                insight_type="peak",
                severity="high" if peak["predicted"] > max_val * 0.9 else "medium",
                title="Peak Traffic Period Detected",
                description=f"Highest predicted traffic volume of {peak['predicted']:.0f} expected around {peak['timestamp'][:16]}. Consider alternate routes or delayed travel.",
                timestamp_start=peak["timestamp"],
                metadata={"peak_value": peak["predicted"], "threshold": p80},
            ))

        # Congestion window
        high_periods = [d for d in self.data if d["predicted"] > p80 * 1.1]
        if len(high_periods) >= 3:
            insights.append(Insight.objects.create(
                prediction=self.prediction,
                insight_type="hotspot",
                severity="high",
                title="Extended Congestion Window",
                description=f"Sustained high traffic predicted across {len(high_periods)} time periods. Plan accordingly.",
                metadata={"count": len(high_periods)},
            ))

        # Low traffic window = travel suggestion
        lows = [d for d in self.data if d["predicted"] < sorted(values)[int(len(values) * 0.2)]]
        if lows:
            low = min(lows, key=lambda x: x["predicted"])
            insights.append(Insight.objects.create(
                prediction=self.prediction,
                insight_type="suggestion",
                severity="low",
                title="Optimal Travel Window",
                description=f"Traffic volume drops to {low['predicted']:.0f} around {low['timestamp'][:16]}. This is the best time to travel.",
                timestamp_start=low["timestamp"],
                metadata={"low_value": low["predicted"]},
            ))

        # Anomaly: sudden spike
        for i in range(1, len(values)):
            if values[i] > values[i-1] * 1.5 and values[i] > p80:
                insights.append(Insight.objects.create(
                    prediction=self.prediction,
                    insight_type="anomaly",
                    severity="high",
                    title="Sudden Traffic Spike",
                    description=f"Unexpected 50%+ traffic increase predicted at {self.data[i]['timestamp'][:16]}.",
                    timestamp_start=self.data[i]["timestamp"],
                    metadata={"from": values[i-1], "to": values[i]},
                ))
                break

        return Insight.objects.filter(prediction=self.prediction)
