// src/components/CalendarViews/WeekView.jsx
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import { fetchOHLCV } from "../../services/binanceService";

const WeekView = ({ darkMode, date, selectedSymbol, GlobalTooltip, onCellClick }) => {
  const [weeklyMetricsMap, setWeeklyMetricsMap] = useState({});
  const [volatilityThresholds, setVolatilityThresholds] = useState({
    low: 0,
    high: 0,
  });
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
    const fetchYearlyWeeklyMetrics = async () => {
      setLoading(true);
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
      setLoading(false);
    };

    fetchYearlyWeeklyMetrics();
  }, [date, selectedSymbol]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      flexGrow={1}
      overflow="auto"
      maxHeight="70vh"
      display="flex"
      flexDirection="column"
      gap={1}
    >
      {Object.entries(weeklyMetricsMap)
        .slice(0, 56)
        .reduce((rows, [key, val], idx) => {
          const rowIdx = Math.floor(idx / 7);
          if (!rows[rowIdx]) rows[rowIdx] = [];
          rows[rowIdx].push([key, val]);
          return rows;
        }, [])
        .map((row, idx) => {
          const paddedRow = [...row];
          while (paddedRow.length < 7) paddedRow.push(null);

          return (
            <Box key={idx} display="flex" width="100%" gap={1}>
              {paddedRow.map((entry, cellIdx) => {
                if (!entry) {
                  return (
                    <Box
                      key={`empty-${idx}-${cellIdx}`}
                      sx={{
                        width: "14.2857%",
                        aspectRatio: "3 / 2",
                        border: "2px dashed transparent",
                        borderRadius: 1,
                      }}
                    />
                  );
                }

                const [key, data] = entry;
                const perf =
                  data.close > data.open
                    ? "up"
                    : data.close < data.open
                    ? "down"
                    : "neutral";

                let bgColor = darkMode ? "#12263a" : "#f0f0f0";
                if (data.vola < volatilityThresholds.low) bgColor = "#d0f0c0";
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
                      sx={{
                        width: "14.2857%",
                        aspectRatio: "3 / 2",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: bgColor,
                        border: "2px solid #ccc",
                        borderRadius: 1,
                        p: 1,
                        fontWeight: "bold",
                        color: darkMode ? "#fff" : "#000",
                      }}
                      onClick={() =>
                        onCellClick?.({
                          start: key.split("_")[0],
                          end: key.split("_")[1],
                        })
                      }
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
          );
        })}
    </Box>
  );
};

export default WeekView;
