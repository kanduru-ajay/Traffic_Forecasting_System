import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Divider } from "@mui/material";
import { TrafficRounded } from "@mui/icons-material";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const { login, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    const res = await login(form);
    if (res.success) navigate("/");
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"
      sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)" }}>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <TrafficRounded sx={{ fontSize: 48, color: "primary.main" }} />
            <Typography variant="h5" fontWeight={700} mt={1}>Traffic Forecasting</Typography>
            <Typography color="text.secondary" variant="body2">Sign in to your account</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handle}>
            <TextField fullWidth label="Username" value={form.username} sx={{ mb: 2 }}
              onChange={(e) => setForm({ ...form, username: e.target.value })} autoFocus />
            <TextField fullWidth label="Password" type="password" value={form.password} sx={{ mb: 3 }}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
