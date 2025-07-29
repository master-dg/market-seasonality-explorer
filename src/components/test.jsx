import React, { useState } from "react";
import { useEffect } from "react";
import { Box, IconButton, TextField, Paper } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { fetchOHLCV } from "../services/binanceService";
import utc from "dayjs/plugin/utc";
import { Tooltip } from "@mui/material";
import { styled, tooltipClasses } from "@mui/material";

const GlobalTooltip = styled(({ className, ...props }) => (
  <Tooltip arrow placement="top" {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    fontSize: "0.75rem",
    borderRadius: 6,
    padding: "8px 12px",
    lineHeight: 1.5,
    maxWidth: 220,
  },
}));

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const CalendarView = ({ darkMode, mode, selectionType, selectedSymbol }) => {
  const [date, setDate] = useState(dayjs());
  const [monthInput, setMonthInput] = useState(date.format("MM"));
  const [yearInput, setYearInput] = useState(date.format("YYYY"));
  const [dailyPerformance, setDailyPerformance] = useState({});
  const [volatilityMap, setVolatilityMap] = useState({});
  const [percentMap, setPercentMap] = useState({});
  const [monthlyMetrics, setMonthlyMetrics] = useState({});
  const [volatilityThresholds, setVolatilityThresholds] = useState({
    low: 0,
    high: 0,
  });
  const [volumeMap, setVolumeMap] = useState({});
  const [volumeThresholds, setVolumeThresholds] = useState({ low: 0, high: 0 });
  const [weeklyMetricsMap, setWeeklyMetricsMap] = useState({});

  const today = dayjs();

  const quantile = (arr, q) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  useEffect(() => {
    const fetchYearlyWeeklyMetrics = async () => {
      if (mode !== "week" || selectionType !== "single") return;

      const year = date.year();
      const startDate = dayjs(`${year}-01-01`).startOf("week");
      const endDate = dayjs(`${year}-12-31`).endOf("week");

      let current = startDate;
      const result = {};
      const volumes = [];
      const vols = [];

      while (current.isBefore(endDate)) {
        const start = current;
        const end = current.add(6, "day");
        const ohlcv = await fetchOHLCV(
          selectedSymbol,
          "1d",
          1000,
          start.valueOf(),
          end.valueOf()
        );

        if (ohlcv.length === 0) {
          current = current.add(7, "day");
          continue;
        }

        const open = parseFloat(ohlcv[0].open);
        const close = parseFloat(ohlcv[ohlcv.length - 1].close);
        const volume = ohlcv.reduce((acc, e) => acc + parseFloat(e.volume), 0);
        const vola =
          ohlcv.reduce(
            (acc, e) => acc + (parseFloat(e.high) - parseFloat(e.low)),
            0
          ) / ohlcv.length;

        const key = `${start.format("YYYY-MM-DD")}_${end.format("YYYY-MM-DD")}`;
        result[key] = {
          open,
          close,
          volume,
          vola,
          label: `${start.format("MMM D")} - ${end.format("MMM D")}`,
        };

        volumes.push(volume);
        vols.push(vola);

        current = current.add(7, "day");
      }

      setWeeklyMetricsMap(result);
      setVolumeThresholds({
        low: quantile(volumes, 0.33),
        high: quantile(volumes, 0.66),
      });
      setVolatilityThresholds({
        low: quantile(vols, 0.33),
        high: quantile(vols, 0.66),
      });
    };

    fetchYearlyWeeklyMetrics();
  }, [mode, selectionType, date, selectedSymbol]);

  useEffect(() => {
    const fetchMonthlyOHLC = async () => {
      if (mode !== "day" || selectionType !== "single") return;

      try {
        const startTime = date.startOf("month").valueOf(); // milliseconds
        const endTime = date.endOf("month").valueOf(); // milliseconds

        const ohlcv = await fetchOHLCV(
          selectedSymbol,
          "1d",
          1000,
          startTime,
          endTime
        );
        // +2 buffer
        const map = {}; // <--- This is what you're missing
        const volMap = {};
        const volData = {};
        const volumeValues = [];
        const percentages = {};

        ohlcv.forEach((entry) => {
          const entryDate = dayjs(entry.time);
          const key = entryDate.format("YYYY-MM-DD");
          const open = parseFloat(entry.open);
          const close = parseFloat(entry.close);
          const high = parseFloat(entry.high);
          const low = parseFloat(entry.low);
          const volume = parseFloat(entry.volume);
          const diff = close - open;
          const percent = ((close - open) / open) * 100;

          percentages[key] = percent;

          map[key] = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
          volMap[key] = high - low;
          volData[key] = volume;
          volumeValues.push(volume);
        });

        const lowVol = quantile(volumeValues, 0.33);
        const highVol = quantile(volumeValues, 0.66);
        const volatilityValues = ohlcv.map(
          (entry) => parseFloat(entry.high) - parseFloat(entry.low)
        );
        const lowVolatility = quantile(volatilityValues, 0.33);
        const highVolatility = quantile(volatilityValues, 0.66);

        setDailyPerformance(map);
        setVolatilityMap(volMap);
        setVolatilityThresholds({ low: lowVolatility, high: highVolatility });
        setVolumeMap(volData);
        setVolumeThresholds({ low: lowVol, high: highVol });
        setPercentMap(percentages);
      } catch (error) {
        console.error("Failed to load OHLC for calendar:", error);
      }
    };

    fetchMonthlyOHLC();
  }, [mode, selectionType, date, selectedSymbol]);

  const updateDateFromInputs = () => {
    const m = parseInt(monthInput, 10) - 1;
    const y = parseInt(yearInput, 10);
    if (m >= 0 && m < 12 && y >= 2020 && y <= 2025) {
      setDate(dayjs().year(y).month(m).date(1));
    } else {
      setMonthInput(date.format("MM"));
      setYearInput(date.format("YYYY"));
    }
  };

  const goToPreviousMonth = () => {
    const newDate = date.subtract(1, "month");
    if (newDate.isBefore(dayjs("2020-01-01"))) return;
    setDate(newDate);
    setMonthInput(newDate.format("MM"));
    setYearInput(newDate.format("YYYY"));
  };

  const goToNextMonth = () => {
    const newDate = date.add(1, "month");
    if (newDate.isAfter(dayjs("2025-12-31"))) return;
    setDate(newDate);
    setMonthInput(newDate.format("MM"));
    setYearInput(newDate.format("YYYY"));
  };

  useEffect(() => {
    const fetchYearlyMonthlyMetrics = async () => {
      if (mode !== "month" || selectionType !== "single") return;

      try {
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
          const volume = ohlcv.reduce(
            (sum, entry) => sum + parseFloat(entry.volume),
            0
          );
          volumeValues.push(volume);
          const volatility =
            ohlcv.reduce(
              (sum, entry) =>
                sum + (parseFloat(entry.high) - parseFloat(entry.low)),
              0
            ) / ohlcv.length;

          const key = `${date.year()}-${String(m + 1).padStart(2, "0")}`;
          results[key] = { open, close, volume, volatility };
          volValues.push(volatility);
        }

        // Calculate thresholds
        const low = quantile(volValues, 0.33);
        const high = quantile(volValues, 0.66);
        const volLow = quantile(volumeValues, 0.33);
        const volHigh = quantile(volumeValues, 0.66);

        setMonthlyMetrics(results);
        setVolatilityThresholds({ low, high });
        setVolumeThresholds({ low: volLow, high: volHigh });
      } catch (err) {
        console.error("Failed to load monthly metrics:", err);
      }
    };

    fetchYearlyMonthlyMetrics();
  }, [mode, selectionType, date, selectedSymbol]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {mode === "day" && selectionType === "single" ? (
        <>
          {/* Top Controls */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={5}
          >
            <IconButton
              onClick={goToPreviousMonth}
              disabled={date.isSameOrBefore(dayjs("2020-01-01"), "month")}
            >
              <ArrowBackIos />
            </IconButton>

            <TextField
              label="Month"
              type="number"
              size="small"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              onBlur={updateDateFromInputs}
              onKeyDown={(e) => e.key === "Enter" && updateDateFromInputs()}
              inputProps={{ min: 1, max: 12 }}
              sx={{ width: 80 }}
            />

            <TextField
              label="Year"
              type="number"
              size="small"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onBlur={updateDateFromInputs}
              onKeyDown={(e) => e.key === "Enter" && updateDateFromInputs()}
              inputProps={{ min: 2020, max: 2025 }}
              sx={{ width: 100 }}
            />

            <IconButton
              onClick={goToNextMonth}
              disabled={date.isSameOrAfter(dayjs("2025-12-01"), "month")}
            >
              <ArrowForwardIos />
            </IconButton>
          </Box>

          {/* 7×7 Matrix */}
          <Box flexGrow={1} display="flex" flexDirection="column" gap={1}>
            {/* First Row: Day Labels */}
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

            {/* Date Matrix */}
            {(() => {
              const startOfMonth = date.startOf("month");
              const daysInMonth = date.daysInMonth();
              const startDay = startOfMonth.day();

              const calendarCells = [];
              for (let i = 0; i < startDay; i++) calendarCells.push(null);
              for (let i = 1; i <= daysInMonth; i++) calendarCells.push(i);
              while (calendarCells.length < 42) calendarCells.push(null);

              const dateRows = [];
              for (let i = 0; i < 6; i++) {
                dateRows.push(calendarCells.slice(i * 7, i * 7 + 7));
              }

              return dateRows.map((week, rowIndex) => {
                const isEmptyRow = week.every((cell) => cell === null);
                if (isEmptyRow) return null;

                return (
                  <Box key={`week-${rowIndex}`} display="flex" flex="1" gap={1}>
                    {week.map((dateValue, colIdx) => {
                      const cellDate = dayjs(date).date(dateValue);
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

                        if (v < low)
                          bgColor = "#d0f0c0"; // low volatility: green
                        else if (v < high)
                          bgColor = "#ffe699"; // medium: yellow/orange
                        else bgColor = "#ffc1c1"; // high: red
                      }

                      return (
                        <GlobalTooltip
                          title={
                            dateValue && !isFuture ? (
                              <Box>
                                <div>
                                  <strong>{key}</strong>
                                </div>
                                <div>
                                  Performance:{" "}
                                  {percentMap?.[key] !== undefined
                                    ? `${percentMap[key].toFixed(2)}%`
                                    : "N/A"}
                                </div>
                                <div>
                                  Volume:{" "}
                                  {volumeMap?.[key] !== undefined
                                    ? volumeMap[key].toLocaleString()
                                    : "N/A"}
                                </div>
                                <div>
                                  Volatility:{" "}
                                  {volatilityMap?.[key] !== undefined
                                    ? volatilityMap[key].toFixed(2)
                                    : "N/A"}
                                </div>
                              </Box>
                            ) : (
                              ""
                            )
                          }
                        >
                          <Box
                            key={`cell-${rowIndex}-${colIdx}`}
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
                                isToday
                                  ? "#00b4ff"
                                  : darkMode
                                  ? "#1e3a5f"
                                  : "#ccc"
                              }`,
                              borderRadius: 1,
                              py: 0.5,
                            }}
                          >
                            {dateValue || ""}
                            {dateValue &&
                              (() => {
                                if (isFuture) return null;

                                return (
                                  <Box
                                    display="flex"
                                    flexDirection="row"
                                    alignItems="center"
                                    justifyContent="center"
                                    mt={0.5}
                                    gap={1.2}
                                  >
                                    {/* Performance Arrow */}
                                    <Box fontSize="1rem" lineHeight="1">
                                      {dailyPerformance?.[key] === "up" && (
                                        <span style={{ color: "limegreen" }}>
                                          ▲
                                        </span>
                                      )}
                                      {dailyPerformance?.[key] === "down" && (
                                        <span style={{ color: "red" }}>▼</span>
                                      )}
                                      {dailyPerformance?.[key] ===
                                        "neutral" && (
                                        <span style={{ color: "gray" }}>•</span>
                                      )}
                                    </Box>

                                    {/* Volume Liquidity Circle */}
                                    {volumeMap?.[key] !== undefined && (
                                      <Box
                                        sx={{
                                          width: 4,
                                          height:
                                            volumeMap[key] <
                                            volumeThresholds.low
                                              ? 6
                                              : volumeMap[key] <
                                                volumeThresholds.high
                                              ? 12
                                              : 18,
                                          backgroundColor:
                                            volumeMap[key] <
                                            volumeThresholds.low
                                              ? "#90caf9"
                                              : volumeMap[key] <
                                                volumeThresholds.high
                                              ? "#2196f3"
                                              : "#0d47a1",
                                          borderRadius: 1,
                                          transition: "height 0.3s ease-in-out",
                                        }}
                                      />
                                    )}
                                  </Box>
                                );
                              })()}
                          </Box>
                        </GlobalTooltip>
                      );
                    })}
                  </Box>
                );
              });
            })()}
          </Box>
        </>
      ) : mode === "month" && selectionType === "single" ? (
        <>
          {/* Top Year Controls */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={5}
          >
            <IconButton
              onClick={() => {
                const newDate = date.subtract(1, "year");
                if (newDate.year() >= 2020) {
                  setDate(newDate);
                  setYearInput(newDate.format("YYYY"));
                }
              }}
            >
              <ArrowBackIos />
            </IconButton>

            <TextField
              label="Year"
              type="number"
              size="small"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onBlur={() => {
                const y = parseInt(yearInput, 10);
                if (y >= 2020 && y <= 2025) {
                  setDate(dayjs().year(y).startOf("year"));
                } else {
                  setYearInput(date.format("YYYY"));
                }
              }}
              inputProps={{ min: 2020, max: 2025 }}
              sx={{ width: 100 }}
            />

            <IconButton
              onClick={() => {
                const newDate = date.add(1, "year");
                if (newDate.year() <= 2025) {
                  setDate(newDate);
                  setYearInput(newDate.format("YYYY"));
                }
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          </Box>

          {/* 4×3 Month Grid */}
          <Box flexGrow={1} display="flex" flexDirection="column" gap={1}>
            {[0, 1, 2, 3].map((row) => (
              <Box key={row} display="flex" flex="1" gap={1}>
                {[0, 1, 2].map((col) => {
                  const monthIndex = row * 3 + col;
                  const monthNames = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ];

                  const monthKey = `${date.year()}-${String(
                    monthIndex + 1
                  ).padStart(2, "0")}`;
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
                            <div>
                              <strong>
                                {monthNames[monthIndex]} {date.year()}
                              </strong>
                            </div>
                            <div>
                              Performance:{" "}
                              {(
                                ((metrics.close - metrics.open) /
                                  metrics.open) *
                                100
                              ).toFixed(2)}
                              %
                            </div>
                            <div>Volume: {metrics.volume.toLocaleString()}</div>
                            <div>
                              Volatility: {metrics.volatility.toFixed(2)}
                            </div>
                          </Box>
                        ) : (
                          "No data"
                        )
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
                      >
                        <Box>{monthNames[monthIndex]}</Box>
                        {metrics && (
                          <Box
                            mt={0.5}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap={1.2}
                          >
                            {/* Performance Arrow */}
                            <Box fontSize="1rem" lineHeight="1">
                              {isPositive && (
                                <span style={{ color: "limegreen" }}>▲</span>
                              )}
                              {isNegative && (
                                <span style={{ color: "red" }}>▼</span>
                              )}
                              {!isPositive && !isNegative && (
                                <span style={{ color: "gray" }}>•</span>
                              )}
                            </Box>

                            {/* Volume / Liquidity Bar */}
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
                                transition: "height 0.3s ease-in-out",
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
        </>
      ) : mode === "week" && selectionType === "single" ? (
        <>
          {/* Year Navigation */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={5}
          >
            <IconButton
              onClick={() => {
                const newDate = date.subtract(1, "year");
                if (newDate.year() >= 2020) {
                  setDate(newDate);
                  setYearInput(newDate.format("YYYY"));
                }
              }}
            >
              <ArrowBackIos />
            </IconButton>
            <TextField
              label="Year"
              type="number"
              size="small"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onBlur={() => {
                const y = parseInt(yearInput, 10);
                if (y >= 2020 && y <= 2025) {
                  setDate(dayjs().year(y));
                } else {
                  setYearInput(date.format("YYYY")); // Revert invalid input
                }
              }}
              inputProps={{ min: 2020, max: 2025 }}
              sx={{ width: 100 }}
            />
            <IconButton
              onClick={() => {
                const newDate = date.add(1, "year");
                if (newDate.year() <= 2025) {
                  setDate(newDate);
                  setYearInput(newDate.format("YYYY"));
                }
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          </Box>

          {/* Week Grid */}
          <Box
            flexGrow={1}
            overflow="auto"
            maxHeight="70vh" // or any height you prefer
            display="flex"
            flexDirection="column"
            gap={1}
          >
            {Object.entries(weeklyMetricsMap)
              .slice(0, 56) // Display first 56 weeks max (7x8)
              .reduce((rows, [key, val], idx) => {
                const rowIdx = Math.floor(idx / 7);
                if (!rows[rowIdx]) rows[rowIdx] = [];
                rows[rowIdx].push([key, val]);
                return rows;
              }, [])
              .map((row, idx) => (
                <Box key={idx} display="flex" flex="1" gap={1}>
                  {row.map(([key, data]) => {
                    const perf =
                      data.close > data.open
                        ? "up"
                        : data.close < data.open
                        ? "down"
                        : "neutral";
                    let bgColor = darkMode ? "#12263a" : "#f0f0f0";
                    if (data.vola < volatilityThresholds.low)
                      bgColor = "#d0f0c0";
                    else if (data.vola < volatilityThresholds.high)
                      bgColor = "#ffe699";
                    else bgColor = "#ffc1c1";

                    return (
                      <GlobalTooltip
                        key={key}
                        title={
                          <Box>
                            <div>
                              <strong>{data.label}</strong>
                            </div>
                            <div>
                              Performance:{" "}
                              {(
                                ((data.close - data.open) / data.open) *
                                100
                              ).toFixed(2)}
                              %
                            </div>
                            <div>Volume: {data.volume.toLocaleString()}</div>
                            <div>Volatility: {data.vola.toFixed(2)}</div>
                          </Box>
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
                        >
                          <Box>{data.label}</Box>
                          <Box
                            mt={0.5}
                            display="flex"
                            gap={1.2}
                            alignItems="center"
                          >
                            <Box fontSize="1rem">
                              {perf === "up" && (
                                <span style={{ color: "limegreen" }}>▲</span>
                              )}
                              {perf === "down" && (
                                <span style={{ color: "red" }}>▼</span>
                              )}
                              {perf === "neutral" && (
                                <span style={{ color: "gray" }}>•</span>
                              )}
                            </Box>
                            <Box
                              sx={{
                                width: 4,
                                height:
                                  data.volume < volumeThresholds.low
                                    ? 6
                                    : data.volume < volumeThresholds.high
                                    ? 12
                                    : 18,
                                backgroundColor:
                                  data.volume < volumeThresholds.low
                                    ? "#90caf9"
                                    : data.volume < volumeThresholds.high
                                    ? "#2196f3"
                                    : "#0d47a1",
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                        </Box>
                      </GlobalTooltip>
                    );
                  })}
                </Box>
              ))}
          </Box>
        </>
      ) : (
        <Box textAlign="center" p={2}>
          No view selected.
        </Box>
      )}
    </Paper>
  );
};

export default CalendarView;
