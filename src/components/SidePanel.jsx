import React, { useEffect, useState } from "react";
import { Drawer, Typography, Box, Divider } from "@mui/material";
import CandlestickChart from "./CandlestickChart";
import { fetchOHLCV } from "../services/binanceService";
import dayjs from "dayjs";

const SidePanel = ({ open, onClose, selectedDateInfo, selectedSymbol, mode }) => {
  const [ohlcvData, setOhlcvData] = useState([]);
  const [header, setHeader] = useState("");
  const [ohlc, setOhlc] = useState(null);
  const [range, setRange] = useState({ start: null, end: null });

  useEffect(() => {
    const loadData = async () => {
      if (!selectedDateInfo) return;
      let start, end, interval;

      if (mode === "day") {
        interval = "1h";
        const date = dayjs(selectedDateInfo);
        if (!date.isValid()) return;
        start = date.startOf("day");
        end = date.endOf("day");
        setHeader(start.format("MMM D, YYYY"));
      } else if (mode === "week") {
        interval = "1d";
        start = dayjs(selectedDateInfo.start);
        end = dayjs(selectedDateInfo.end);
        setHeader(`${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`);
      } else if (mode === "month") {
        interval = "1d";
        const month = dayjs(selectedDateInfo);
        if (!month.isValid()) return;
        start = month.startOf("month");
        end = month.endOf("month");
        setHeader(start.format("MMMM YYYY"));
      }

      const data = await fetchOHLCV(selectedSymbol, interval, 1000, start.valueOf(), end.valueOf());
      setOhlcvData(data);
      setRange({ start, end });

      if (data.length > 0) {
        const open = parseFloat(data[0].open);
        const close = parseFloat(data[data.length - 1].close);
        const high = Math.max(...data.map((d) => parseFloat(d.high)));
        const low = Math.min(...data.map((d) => parseFloat(d.low)));
        setOhlc({ open, high, low, close });
      }
    };

    loadData();
  }, [selectedDateInfo, selectedSymbol, mode]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box p={2} width={400}>
        <Typography variant="h6">{header}</Typography>
        {ohlc && (
          <>
            <Typography variant="body2" mt={2}>
              <strong>Open:</strong> {ohlc.open.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>High:</strong> {ohlc.high.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>Low:</strong> {ohlc.low.toFixed(2)}
            </Typography>
            <Typography variant="body2" mb={2}>
              <strong>Close:</strong> {ohlc.close.toFixed(2)}
            </Typography>
            <Divider />
          </>
        )}

        <Box mt={2}>
          <CandlestickChart
            ohlcvData={ohlcvData}
            startDate={range.start}
            endDate={range.end}
            xAxisLabel={mode === "day" ? "Hour" : "Date"}
            hideSMA
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default SidePanel;