import React, { useEffect, useState } from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  TextField,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const SelectionPanel = ({
  darkMode,
  mode,
  selectionType,
  onModeChange,
  onTypeChange,
  selectedSymbol,
  onSymbolChange,
}) => {
  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const { data } = await axios.get("https://api.binance.com/api/v3/exchangeInfo");
        const tradable = data.symbols
          .filter((s) => s.status === "TRADING" && s.isSpotTradingAllowed)
          .map((s) => s.symbol)
          .sort();
        setSymbols(tradable);
      } catch (err) {
        console.error("Error fetching Binance symbols", err);
      }
    };

    fetchSymbols();
  }, []);

  const handleModeChange = (_, newMode) => {
    if (newMode !== null) {
      onModeChange(newMode);
    }
  };

  const handleTypeChange = (_, newType) => {
    if (newType !== null) {
      onTypeChange(newType);
    }
  };

  const handleSymbolChange = (e) => {
    onSymbolChange(e.target.value);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        p: 2,
        backgroundColor: darkMode ? "#12263a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#000000",
        borderRadius: 2,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={4}
      >
        {/* View Mode Section */}
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: darkMode ? "#90caf9" : "#0d47a1",
            }}
          >
            View Mode
          </Typography>

          <ToggleButtonGroup
            value={selectionType === "single" ? mode : null}
            exclusive
            onChange={handleModeChange}
            disabled={selectionType !== "single"}
            size="small"
          >
            <ToggleButton value="day" sx={{ color: darkMode ? "#fff" : "#000" }}>
              Day
            </ToggleButton>
            <ToggleButton value="week" sx={{ color: darkMode ? "#fff" : "#000" }}>
              Week
            </ToggleButton>
            <ToggleButton value="month" sx={{ color: darkMode ? "#fff" : "#000" }}>
              Month
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Symbol Dropdown Section */}
        <Box display="flex" flexDirection="column" gap={1} minWidth={140}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: darkMode ? "#90caf9" : "#0d47a1",
            }}
          >
            Symbol
          </Typography>

          <TextField
            select
            size="small"
            value={selectedSymbol}
            onChange={handleSymbolChange}
            sx={{
              minWidth: 140,
              backgroundColor: darkMode ? "#1c2b3a" : "#f4f4f4",
              color: darkMode ? "#fff" : "#000",
            }}
          >
            {symbols.map((symbol) => (
              <MenuItem key={symbol} value={symbol}>
                {symbol}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Selection Section */}
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: darkMode ? "#90caf9" : "#0d47a1",
            }}
          >
            Selection
          </Typography>

          <ToggleButtonGroup
            value={selectionType}
            exclusive
            onChange={handleTypeChange}
            size="small"
          >
            <ToggleButton value="single" sx={{ color: darkMode ? "#fff" : "#000" }}>
              Single
            </ToggleButton>
            <ToggleButton value="period" sx={{ color: darkMode ? "#fff" : "#000" }}>
              Period
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Paper>
  );
};

export default SelectionPanel;
