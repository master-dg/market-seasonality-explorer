import React, { useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import CalendarView from "./components/CalendarView";
import SelectionPanel from "./components/SelectionPanel";
import PeriodView from "./components/PeriodView";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState("day");
  const [selectionType, setSelectionType] = useState("single");
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleTypeChange = (newType) => {
    setSelectionType(newType);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        default: darkMode ? "#0a0e1a" : "#f0f0f0",
      },
      primary: { main: "#00b4ff" },
      secondary: { main: "#00ffb2" },
    },
    typography: { fontFamily: "Inter, sans-serif" },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" height="100vh">
        {/* AppBar */}
        <Box flex="0 0 auto">
          <AppBar
            position="static"
            sx={{
              background: "linear-gradient(to right, #00b4ff, #00ffb2)",
              boxShadow: "none",
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between" }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Outfit, Inter, sans-serif",
                  fontWeight: 700,
                  color: "#0a0e1a",
                  letterSpacing: "1.5px",
                  flexGrow: 1,
                  textAlign: "center",
                  fontSize: { xs: "1.4rem", md: "1.8rem" },
                }}
              >
                MARKET SEASONALITY EXPLORER
              </Typography>

              <Tooltip title="Toggle Theme">
                <IconButton
                  onClick={handleToggleDarkMode}
                  sx={{
                    border: `2px solid ${darkMode ? "#fff" : "#000"}`,
                    borderRadius: "50%",
                  }}
                >
                  {darkMode ? (
                    <LightMode sx={{ color: "#fff" }} />
                  ) : (
                    <DarkMode sx={{ color: "#000" }} />
                  )}
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
        </Box>

        {/* Selection Panel */}
        <Box flex="0 0 auto" px={2} pt={2}>
          <SelectionPanel
            darkMode={darkMode}
            mode={mode}
            selectionType={selectionType}
            onModeChange={handleModeChange}
            onTypeChange={handleTypeChange}
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
          />
        </Box>

        {selectionType === "period" ? (
        <Box flex="1 1 0%" px={2} pb={1} overflow="hidden">
          <PeriodView selectedSymbol={selectedSymbol} darkMode={darkMode} />
        </Box>
      ) : (
        <Box flex="1 1 0%" px={2} pb={1} overflow="hidden">
        <CalendarView
          darkMode={darkMode}
          mode={mode}
          selectionType={selectionType}
          selectedSymbol={selectedSymbol}
        />
        </Box>
      )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
