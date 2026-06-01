import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  LinearProgress, Alert, Chip, List, ListItem, ListItemText,
} from "@mui/material";
import { CloudUpload, CheckCircle } from "@mui/icons-material";
import { datasetAPI } from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setError(""); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !name) { setError("Provide file and dataset name"); return; }
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    try {
      const res = await datasetAPI.upload(fd);
      setResult(res.data);
      setFile(null); setName("");
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box maxWidth={700} mx="auto">
      <Typography variant="h4" fontWeight={700} mb={0.5}>Upload Dataset</Typography>
      <Typography color="text.secondary" mb={3}>
        Upload a CSV file. System will auto-clean, engineer features, and prepare for training.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "divider",
              borderRadius: 2,
              p: 5,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: isDragActive ? "primary.50" : "action.hover",
              transition: "all 0.2s",
              "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
            <Typography variant="h6">
              {file ? file.name : isDragActive ? "Drop it!" : "Drag & drop CSV here"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              or click to browse · CSV only · Max 50MB
            </Typography>
            {file && (
              <Chip label={`${(file.size / 1024 / 1024).toFixed(2)} MB`} color="primary" size="small" sx={{ mt: 1 }} />
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Dataset Details</Typography>
          <TextField
            fullWidth label="Dataset Name" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chennai Highway Q1 2024"
          />
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      <Button
        variant="contained" size="large" fullWidth onClick={handleUpload}
        disabled={uploading || !file || !name} startIcon={<CloudUpload />}
      >
        {uploading ? "Processing..." : "Upload & Process"}
      </Button>

      {result && (
        <Card sx={{ mt: 3, borderColor: "success.main", border: "1px solid" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CheckCircle color="success" />
              <Typography variant="h6" color="success.main" fontWeight={600}>
                Dataset Ready
              </Typography>
            </Box>
            <List dense>
              <ListItem><ListItemText primary="Rows" secondary={result.row_count} /></ListItem>
              <ListItem><ListItemText primary="Features" secondary={result.column_count} /></ListItem>
              <ListItem><ListItemText primary="Status" secondary={result.status} /></ListItem>
            </List>
            <Typography variant="caption" color="text.secondary">
              Preprocessing: {result.preprocessing_log?.join(" → ")}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
