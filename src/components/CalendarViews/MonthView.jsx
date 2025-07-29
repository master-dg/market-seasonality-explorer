// src/components/CalendarViews/MonthView.jsx
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import { fetchOHLCV } from "../../services/binanceService";

const MonthView = ({ darkMode, date, selectedSymbol, GlobalTooltip, onCellClick}) => {
  const [monthlyMetrics, setMonthlyMetrics] = useState({});
  const [volatilityThresholds, setVolatilityThresholds] = useState({ low: 0, high: 0 });
  const [volumeThresholds, setVolumeThresholds] = useState({ low: 0, high: 0 });
  const [loading, setLoading] = useState(true);

  const quantile = (arr, q) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  };

  useEffect(() => {
    const fetchYearlyMonthlyMetrics = async () => {
      setLoading(true);
      const results = {};
      const volValues = [];
      const volumeValues = [];

      for (let m = 0; m < 12; m++) {
        const start = dayjs().year(date.year()).month(m).startOf("month");
        const end = start.endOf("month");
        const ohlcv = await fetchOHLCV(
          selectedSymbol,
          "1d",
          1000,
          start.valueOf(),
          end.valueOf()
        );

        if (ohlcv.length === 0) continue;

        const open = parseFloat(ohlcv[0].open);
        const close = parseFloat(ohlcv[ohlcv.length - 1].close);
        const volume = ohlcv.reduce((sum, entry) => sum + parseFloat(entry.volume), 0);
        const volatility =
          ohlcv.reduce((sum, entry) => sum + (parseFloat(entry.high) - parseFloat(entry.low)), 0) /
          ohlcv.length;

        const key = `${date.year()}-${String(m + 1).padStart(2, "0")}`;
        results[key] = { open, close, volume, volatility };
        volValues.push(volatility);
        volumeValues.push(volume);
      }

      setMonthlyMetrics(results);
      setVolatilityThresholds({ low: quantile(volValues, 0.33), high: quantile(volValues, 0.66) });
      setVolumeThresholds({ low: quantile(volumeValues, 0.33), high: quantile(volumeValues, 0.66) });
      setLoading(false);
    };

    fetchYearlyMonthlyMetrics();
  }, [date, selectedSymbol]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box flexGrow={1} display="flex" flexDirection="column" gap={1}>
      {[0, 1, 2, 3].map((row) => (
        <Box key={row} display="flex" flex="1" gap={1}>
          {[0, 1, 2].map((col) => {
            const monthIndex = row * 3 + col;
            const monthKey = `${date.year()}-${String(monthIndex + 1).padStart(2, "0")}`;
            const metrics = monthlyMetrics[monthKey];
            const isPositive = metrics && metrics.close > metrics.open;
            const isNegative = metrics && metrics.close < metrics.open;

            let bgColor = darkMode ? "#12263a" : "#f0f0f0";
            if (metrics) {
              const v = metrics.volatility;
              const { low, high } = volatilityThresholds;
              if (v < low) bgColor = "#d0f0c0";
              else if (v < high) bgColor = "#ffe699";
              else bgColor = "#ffc1c1";
            }

            return (
              <GlobalTooltip
                key={monthIndex}
                title={
                  metrics ? (
                    <Box>
                      <div><strong>{monthNames[monthIndex]} {date.year()}</strong></div>
                      <div>Performance: {(((metrics.close - metrics.open) / metrics.open) * 100).toFixed(2)}%</div>
                      <div>Volume: {metrics.volume.toLocaleString()}</div>
                      <div>Volatility: {metrics.volatility.toFixed(2)}</div>
                    </Box>
                  ) : "No data"
                }
              >
                <Box
                  flex="1"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    backgroundColor: bgColor,
                    border: "2px solid #ccc",
                    borderRadius: 1,
                    p: 1,
                    fontWeight: "bold",
                    color: darkMode ? "#fff" : "#000",
                  }}
                  onClick={() => onCellClick?.(`${date.year()}-${String(monthIndex + 1).padStart(2, "0")}`)}

                >
                  <Box>{monthNames[monthIndex]}</Box>
                  {metrics && (
                    <Box mt={0.5} display="flex" alignItems="center" justifyContent="center" gap={1.2}>
                      <Box fontSize="1rem">
                        {isPositive && <span style={{ color: "limegreen" }}>▲</span>}
                        {isNegative && <span style={{ color: "red" }}>▼</span>}
                        {!isPositive && !isNegative && <span style={{ color: "gray" }}>•</span>}
                      </Box>
                      <Box
                        sx={{
                          width: 4,
                          height:
                            metrics.volume < volumeThresholds.low
                              ? 6
                              : metrics.volume < volumeThresholds.high
                              ? 12
                              : 18,
                          backgroundColor:
                            metrics.volume < volumeThresholds.low
                              ? "#90caf9"
                              : metrics.volume < volumeThresholds.high
                              ? "#2196f3"
                              : "#0d47a1",
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </GlobalTooltip>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default MonthView;
