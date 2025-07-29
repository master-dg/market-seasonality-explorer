// src/components/CalendarViews/DayView.jsx
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import { fetchOHLCV } from "../../services/binanceService";

const DayView = ({ darkMode, date, today, selectedSymbol, GlobalTooltip, onCellClick}) => {
  const [dailyPerformance, setDailyPerformance] = useState({});
  const [volatilityMap, setVolatilityMap] = useState({});
  const [volumeMap, setVolumeMap] = useState({});
  const [percentMap, setPercentMap] = useState({});
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
    const fetchMonthlyOHLC = async () => {
      setLoading(true);
      try {
        const startTime = date.startOf("month").valueOf();
        const endTime = date.endOf("month").valueOf();
        const ohlcv = await fetchOHLCV(selectedSymbol, "1d", 1000, startTime, endTime);

        const performance = {}, volMap = {}, volData = {}, percentages = {}, volumeValues = [], volatilityValues = [];

        ohlcv.forEach((entry) => {
          const d = dayjs(entry.time).format("YYYY-MM-DD");
          const open = parseFloat(entry.open), close = parseFloat(entry.close);
          const high = parseFloat(entry.high), low = parseFloat(entry.low);
          const volume = parseFloat(entry.volume);
          const percent = ((close - open) / open) * 100;

          performance[d] = close > open ? "up" : close < open ? "down" : "neutral";
          volMap[d] = high - low;
          volData[d] = volume;
          percentages[d] = percent;

          volumeValues.push(volume);
          volatilityValues.push(high - low);
        });

        setDailyPerformance(performance);
        setVolatilityMap(volMap);
        setVolumeMap(volData);
        setPercentMap(percentages);
        setVolumeThresholds({
          low: quantile(volumeValues, 0.33),
          high: quantile(volumeValues, 0.66),
        });
        setVolatilityThresholds({
          low: quantile(volatilityValues, 0.33),
          high: quantile(volatilityValues, 0.66),
        });
      } catch (error) {
        console.error("Error fetching daily OHLCV:", error);
      }
      setLoading(false);
    };

    fetchMonthlyOHLC();
  }, [date, selectedSymbol]);

  const startOfMonth = date.startOf("month");
  const daysInMonth = date.daysInMonth();
  const startDay = startOfMonth.day();

  const calendarCells = [];
  for (let i = 0; i < startDay; i++) calendarCells.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarCells.push(i);
  while (calendarCells.length < 42) calendarCells.push(null);

  const dateRows = [];
  for (let i = 0; i < 6; i++) {
    const row = calendarCells.slice(i * 7, i * 7 + 7);
    if (row.some((val) => val !== null)) {
      dateRows.push(row);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box flexGrow={1} display="flex" flexDirection="column" gap={1}>
      <Box display="flex" flex="0 0 8%" gap={1}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Box
            key={day}
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            fontSize="0.9rem"
            sx={{
              backgroundColor: darkMode ? "#0f1f35" : "#e3e3e3",
              color: darkMode ? "#90caf9" : "#000",
              borderRadius: 1,
            }}
          >
            {day}
          </Box>
        ))}
      </Box>

      {dateRows.map((week, rowIndex) => (
        <Box key={rowIndex} display="flex" flex="1" gap={1} >
          {week.map((dateValue, colIdx) => {
            const cellDate = date.date(dateValue);
            const key = cellDate.utc().format("YYYY-MM-DD");
            const isToday =
              dateValue &&
              today.date() === dateValue &&
              today.month() === date.month() &&
              today.year() === date.year();
            const isFuture = cellDate.isAfter(today, "day");
            

            let bgColor = darkMode ? "#12263a" : "#ffffff";
            if (!isFuture && volatilityMap[key] !== undefined) {
              const v = volatilityMap[key];
              const { low, high } = volatilityThresholds;
              if (v < low) bgColor = "#d0f0c0";
              else if (v < high) bgColor = "#ffe699";
              else bgColor = "#ffc1c1";
            }

            return (
              <GlobalTooltip
                key={key}
                title={
                  dateValue && !isFuture ? (
                    <Box>
                      <div><strong>{key}</strong></div>
                      <div>Performance: {percentMap?.[key] !== undefined ? `${percentMap[key].toFixed(2)}%` : "N/A"}</div>
                      <div>Volume: {volumeMap?.[key] !== undefined ? volumeMap[key].toLocaleString() : "N/A"}</div>
                      <div>Volatility: {volatilityMap?.[key] !== undefined ? volatilityMap[key].toFixed(2) : "N/A"}</div>
                    </Box>
                  ) : ""
                }
              >
                <Box
                  flex="1"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  sx={{
                    backgroundColor: bgColor,
                    color: darkMode ? "#ffffff" : "#000000",
                    border: `2px solid ${
                      isToday ? "#00b4ff" : darkMode ? "#1e3a5f" : "#ccc"
                    }`,
                    borderRadius: 1,
                    py: 0.5,
                  }}
                  onClick={() => !isFuture && dateValue && onCellClick?.(key)}
                >
                  {dateValue || ""}
                  {dateValue && !isFuture && (
                    <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" mt={0.5} gap={1.2}>
                      <Box fontSize="1rem" lineHeight="1">
                        {dailyPerformance?.[key] === "up" && <span style={{ color: "limegreen" }}>▲</span>}
                        {dailyPerformance?.[key] === "down" && <span style={{ color: "red" }}>▼</span>}
                        {dailyPerformance?.[key] === "neutral" && <span style={{ color: "gray" }}>•</span>}
                      </Box>
                      {volumeMap?.[key] !== undefined && (
                        <Box
                          sx={{
                            width: 4,
                            height:
                              volumeMap[key] < volumeThresholds.low
                                ? 6
                                : volumeMap[key] < volumeThresholds.high
                                ? 12
                                : 18,
                            backgroundColor:
                              volumeMap[key] < volumeThresholds.low
                                ? "#90caf9"
                                : volumeMap[key] < volumeThresholds.high
                                ? "#2196f3"
                                : "#0d47a1",
                            borderRadius: 1,
                            transition: "height 0.3s ease-in-out",
                          }}
                        />
                      )}
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

export default DayView;
