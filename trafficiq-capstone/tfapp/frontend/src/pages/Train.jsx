import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, FormGroup, FormControlLabel,
  Checkbox, Select, MenuItem, FormControl, InputLabel, Button,
  Alert, CircularProgress, Chip, LinearProgress, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip,
} from "@mui/material";
import { Psychology, EmojiEvents } from "@mui/icons-material";
import { datasetAPI, modelAPI } from "../services/api";

const ALGORITHMS = [
  { key: "linear_regression", label: "Linear Regression", desc: "Fast baseline" },
  { key: "random_forest", label: "Random Forest", desc: "Ensemble trees" },
  { key: "xgboost", label: "XGBoost", desc: "Gradient boosting" },
];

export default function Train() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [algos, setAlgos] = useState(["linear_regression", "random_forest", "xgboost"]);
  const [target, setTarget] = useState("volume");
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    datasetAPI.list().then((r) => {
      const ready = (r.data.results || r.data).filter((d) => d.status === "ready");
      setDatasets(ready);
    });
  }, []);

  const toggleAlgo = (algo) => {
    setAlgos((prev) => prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo]);
  };

  const handleTrain = async () => {
    if (!selectedDataset || algos.length === 0) {
      setError("Select dataset and at least one algorithm");
      return;
    }
    setTraining(true); setError(""); setResults([]);
    try {
      const res = await modelAPI.train({
        dataset_id: selectedDataset,
        algorithms: algos,
        target_column: target,
      });
      setResults(res.data.results || res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Training failed");
    } finally {
      setTraining(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>Train Models</Typography>
      <Typography color="text.secondary" mb={3}>
        Select algorithms, configure target, auto-select best model by MAE/RMSE/R²
      </Typography>

      <Box display="flex" gap={3} flexWrap="wrap">
        <Card sx={{ flex: 1, minWidth: 280 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Configuration</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Dataset</InputLabel>
              <Select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)} label="Dataset">
                {datasets.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Target Column" value={target} onChange={(e) => setTarget(e.target.value)} fullWidth sx={{ mb: 2 }} />
            <Typography variant="subtitle2" mb={1}>Algorithms</Typography>
            <FormGroup>
              {ALGORITHMS.map((a) => (
                <FormControlLabel
                  key={a.key}
                  control={<Checkbox checked={algos.includes(a.key)} onChange={() => toggleAlgo(a.key)} />}
                  label={<Box><Typography variant="body2">{a.label}</Typography><Typography variant="caption" color="text.secondary">{a.desc}</Typography></Box>}
                />
              ))}
            </FormGroup>
          </CardContent>
        </Card>

        <Box flex={2} minWidth={300}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {training && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={20} />
                  <Typography>Training models with TimeSeriesSplit cross-validation...</Typography>
                </Box>
                <LinearProgress sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          )}

          <Button
            variant="contained" size="large" fullWidth onClick={handleTrain}
            disabled={training} startIcon={<Psychology />} sx={{ mb: 3 }}
          >
            {training ? "Training..." : "Start Training"}
          </Button>

          {results.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Results</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>MAE</TableCell>
                      <TableCell>RMSE</TableCell>
                      <TableCell>R²</TableCell>
                      <TableCell>Best</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((m) => (
                      <TableRow key={m.id} sx={{ bgcolor: m.is_best ? "success.50" : "inherit" }}>
                        <TableCell>{m.algorithm.replace("_", " ")}</TableCell>
                        <TableCell>{m.mae?.toFixed(4)}</TableCell>
                        <TableCell>{m.rmse?.toFixed(4)}</TableCell>
                        <TableCell>{m.r2?.toFixed(4)}</TableCell>
                        <TableCell>{m.is_best && <EmojiEvents color="warning" fontSize="small" />}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Need TextField import
import { TextField } from "@mui/material";
