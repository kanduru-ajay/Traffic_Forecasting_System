import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, AppBar, IconButton, Avatar,
  Divider, CssBaseline,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Dashboard as DashboardIcon, CloudUpload, Psychology,
  Timeline, Logout, TrafficRounded,
} from "@mui/icons-material";
import useAuthStore from "./store/authStore";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Train from "./pages/Train";
import Forecast from "./pages/Forecast";
import Login from "./pages/Login";

const DRAWER_WIDTH = 240;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#ff6d00" },
    background: { default: "#f5f7fa" },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
  },
  shape: { borderRadius: 10 },
});

const NAV = [
  { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { path: "/upload", label: "Upload Data", icon: <CloudUpload /> },
  { path: "/train", label: "Train Models", icon: <Psychology /> },
  { path: "/forecast", label: "Forecast", icon: <Timeline /> },
];

function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const loc = useLocation();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: "white", color: "text.primary", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
        <Toolbar>
          <TrafficRounded sx={{ color: "primary.main", mr: 1 }} />
          <Typography variant="h6" fontWeight={700} flexGrow={1} color="primary.main">
            TrafficIQ
          </Typography>
          <Typography variant="caption" color="text.secondary" mr={2}>
            {user?.username} · {user?.role}
          </Typography>
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: 14, mr: 1 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <IconButton onClick={logout} size="small"><Logout fontSize="small" /></IconButton>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH,
        "& .MuiDrawer-paper": { width: DRAWER_WIDTH, bgcolor: "#0d2137", color: "white" },
      }}>
        <Toolbar />
        <Box sx={{ overflow: "auto", mt: 1 }}>
          <List>
            {NAV.map(({ path, label, icon }) => (
              <ListItem key={path} disablePadding>
                <ListItemButton
                  component={Link} to={path}
                  selected={loc.pathname === path}
                  sx={{
                    mx: 1, borderRadius: 1, mb: 0.5,
                    "&.Mui-selected": { bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                    color: "white",
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{icon}</ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, init } = useAuthStore();
  useEffect(() => { init(); }, []);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/train" element={<PrivateRoute><Train /></PrivateRoute>} />
          <Route path="/forecast" element={<PrivateRoute><Forecast /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
