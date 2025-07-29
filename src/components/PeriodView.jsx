import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { fetchOHLCV } from "../services/binanceService";
import CandlestickChart from "./CandlestickChart";

dayjs.extend(utc);

const PeriodView = ({ selectedSymbol, darkMode }) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  const minDate = dayjs.utc("2020-01-01");
  const maxDate = dayjs.utc();

  const handleFetch = async () => {
    const [startDate, endDate] = dateRange;
    const adjustedStartDate = startDate.subtract(30, "day");

    if (!selectedSymbol || !startDate || !endDate) return;

    setLoading(true);
    setInfo("Fetching data... Please be patient.");
    try {
      const data = await fetchOHLCV(
        selectedSymbol,
        "1d",
        1000,
        adjustedStartDate.valueOf(),
        endDate.valueOf()
      );

      setOhlcvData(data);
      setInfo(`Fetched ${data.length} records`);
    } catch (err) {
      console.error("Fetch error:", err);
      setInfo("Failed to fetch data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDateRange([null, null]);
    setOhlcvData([]);
    setInfo("");
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        backgroundColor: darkMode ? "#12263a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#000000",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="flex"
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          gap={2}
          mb={3}
        >
          <DateRangePicker
            startText="Start Date (UTC)"
            endText="End Date (UTC)"
            value={dateRange}
            onChange={(newValue) => setDateRange(newValue)}
            minDate={minDate}
            maxDate={maxDate}
            calendars={2}
            inputFormat="YYYY-MM-DD"
            disableFuture
            renderInput={(startProps, endProps) => (
              <>
                <TextField {...startProps} size="small" />
                <Box sx={{ mx: 1 }}>to</Box>
                <TextField {...endProps} size="small" />
              </>
            )}
          />

          <Button
            variant="contained"
            onClick={handleFetch}
            disabled={
              loading ||
              !dateRange[0] ||
              !dateRange[1] ||
              dateRange[1].isBefore(dateRange[0])
            }
          >
            {loading ? "Fetching..." : "Fetch Data"}
          </Button>

          <Button variant="outlined" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
        </Box>
      </LocalizationProvider>
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2}
            mb={2}
          >
            <CircularProgress size={20} />
            <Typography variant="body2">
              Please wait. This may take a few seconds…
            </Typography>
          </Box>
        )}

        {info && (
          <Typography
            variant="body2"
            sx={{
              color: darkMode ? "#90caf9" : "#1976d2",
              textAlign: "center",
            }}
          >
            {info}
          </Typography>
        )}
        {ohlcvData.length > 0 && (
          <Box mt={4}>
            <CandlestickChart
              ohlcvData={ohlcvData}
              startDate={dateRange[0]}
              endDate={dateRange[1]}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PeriodView;
