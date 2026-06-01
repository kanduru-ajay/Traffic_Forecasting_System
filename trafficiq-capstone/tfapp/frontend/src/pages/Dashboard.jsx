import React, { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, Button, Divider,
} from "@mui/material";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Speed, Warning, CheckCircle } from "@mui/icons-material";
import { datasetAPI, modelAPI, predictionAPI, insightAPI } from "../services/api";

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: "100%", background: `linear-gradient(135deg, ${color}15, ${color}05)`, border: `1px solid ${color}30` }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography color="text.secondary" variant="caption" fontWeight={600} textTransform="uppercase">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={color} mt={0.5}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ color, opacity: 0.8, mt: 0.5 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ datasets: 0, models: 0, predictions: 0, insights: 0 });
  const [predictions, setPredictions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ds, ms, ps, ins] = await Promise.all([
          datasetAPI.list(), modelAPI.list(), predictionAPI.list(), insightAPI.list(),
        ]);
        setStats({
          datasets: ds.data.count || ds.data.length || 0,
          models: ms.data.count || ms.data.length || 0,
          predictions: ps.data.count || ps.data.length || 0,
          insights: ins.data.count || ins.data.length || 0,
        });
        const preds = ps.data.results || ps.data || [];
        setPredictions(preds.slice(0, 3));
        setInsights((ins.data.results || ins.data || []).slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sample chart data for demo
  const forecastData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    volume: Math.floor(800 + Math.sin(i / 3) * 300 + Math.random() * 100),
    predicted: Math.floor(820 + Math.sin(i / 3) * 280 + Math.random() * 80),
  }));

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
      <CircularProgress size={48} />
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>Traffic Dashboard</Typography>
      <Typography color="text.secondary" mb={3}>Real-time forecasting & congestion insights</Typography>

      <Grid container spacing={3} mb={4}>
        {[
          { title: "Datasets", value: stats.datasets, icon: <TrendingUp />, color: "#2196f3", subtitle: "CSV uploaded" },
          { title: "Models Trained", value: stats.models, icon: <CheckCircle />, color: "#4caf50", subtitle: "LR · RF · XGBoost" },
          { title: "Forecasts", value: stats.predictions, icon: <Speed />, color: "#ff9800", subtitle: "Hourly · Daily · Weekly" },
          { title: "AI Insights", value: stats.insights, icon: <Warning />, color: "#f44336", subtitle: "Hotspots · Peaks" },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.title}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>24-Hour Traffic Forecast</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="volume" stroke="#2196f3" fill="url(#colorVol)" name="Actual" />
                  <Area type="monotone" dataKey="predicted" stroke="#4caf50" fill="url(#colorPred)" name="Predicted" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>AI Insights</Typography>
              {insights.length === 0 ? (
                <Alert severity="info">No insights yet. Run a forecast first.</Alert>
              ) : (
                insights.map((ins, i) => (
                  <Box key={i} mb={2} p={1.5} borderRadius={1} bgcolor="action.hover">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="subtitle2" fontWeight={600}>{ins.title}</Typography>
                      <Chip
                        label={ins.severity}
                        size="small"
                        color={ins.severity === "high" ? "error" : ins.severity === "medium" ? "warning" : "success"}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{ins.description}</Typography>
                    {i < insights.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
