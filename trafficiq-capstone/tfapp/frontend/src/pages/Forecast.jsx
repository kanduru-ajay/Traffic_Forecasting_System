import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel,
  Select, MenuItem, Slider, Button, Alert, CircularProgress,
  Chip, Grid,
} from "@mui/material";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { Timeline, Lightbulb } from "@mui/icons-material";
import { modelAPI, predictionAPI, insightAPI } from "../services/api";

const SEVERITY_COLOR = { high: "error", medium: "warning", low: "success" };

export default function Forecast() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [horizon, setHorizon] = useState("hourly");
  const [steps, setSteps] = useState(24);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    modelAPI.list().then((r) => {
      const ms = r.data.results || r.data;
      setModels(ms);
      const best = ms.find((m) => m.is_best);
      if (best) setSelectedModel(best.id);
    });
  }, []);

  const handleForecast = async () => {
    if (!selectedModel) { setError("Select a model"); return; }
    setLoading(true); setError(""); setInsights([]);
    try {
      const res = await predictionAPI.forecast({ model_id: selectedModel, horizon, steps });
      setForecast(res.data);
      // Auto-generate insights
      const ins = await insightAPI.generate(res.data.id);
      setInsights(ins.data.results || ins.data || []);
    } catch (e) {
      setError(e.response?.data?.error || "Forecast failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData = forecast?.forecast_data?.map((d) => ({
    time: d.timestamp.slice(11, 16),
    Predicted: d.predicted,
    Upper: d.upper,
    Lower: d.lower,
  })) || [];

  const maxVal = chartData.length ? Math.max(...chartData.map((d) => d.Predicted)) : 0;
  const peakThreshold = maxVal * 0.8;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>Traffic Forecast</Typography>
      <Typography color="text.secondary" mb={3}>Generate hourly · daily · weekly predictions with confidence intervals</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Forecast Settings</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Model</InputLabel>
                <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} label="Model">
                  {models.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.algorithm.replace("_", " ")} {m.is_best && "⭐"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Horizon</InputLabel>
                <Select value={horizon} onChange={(e) => setHorizon(e.target.value)} label="Horizon">
                  {["hourly", "daily", "weekly"].map((h) => (
                    <MenuItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">Steps: {steps}</Typography>
              <Slider value={steps} onChange={(_, v) => setSteps(v)} min={1} max={168} step={1} sx={{ mb: 2 }} />
              {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
              <Button variant="contained" fullWidth onClick={handleForecast} disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Timeline />}>
                {loading ? "Forecasting..." : "Generate Forecast"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {forecast ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {steps}-Step {horizon.charAt(0).toUpperCase() + horizon.slice(1)} Forecast
                  </Typography>
                  <Chip label={`Model: ${forecast.algorithm || "ML"}`} size="small" />
                </Box>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2196f3" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ci" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9e9e9e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#9e9e9e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={Math.floor(chartData.length / 8)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={peakThreshold} stroke="#f44336" strokeDasharray="4 4" label={{ value: "Peak threshold", fill: "#f44336", fontSize: 11 }} />
                    <Area type="monotone" dataKey="Upper" stroke="none" fill="url(#ci)" name="CI Upper" />
                    <Area type="monotone" dataKey="Lower" stroke="none" fill="white" name="CI Lower" />
                    <Area type="monotone" dataKey="Predicted" stroke="#2196f3" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, opacity: 0.5 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Timeline sx={{ fontSize: 64, mb: 1 }} />
                <Typography>Configure and generate a forecast to see results</Typography>
              </CardContent>
            </Card>
          )}

          {insights.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Lightbulb color="warning" />
                  <Typography variant="h6" fontWeight={600}>AI Insights</Typography>
                </Box>
                <Grid container spacing={2}>
                  {insights.map((ins, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Box p={2} borderRadius={1} border="1px solid" borderColor="divider">
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle2" fontWeight={600}>{ins.title}</Typography>
                          <Chip label={ins.severity} size="small" color={SEVERITY_COLOR[ins.severity]} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">{ins.description}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
