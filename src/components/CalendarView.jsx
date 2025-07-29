import React, { useState } from "react";
import { Box, IconButton, TextField, Paper, Tooltip } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { styled, tooltipClasses } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import DayView from "./CalendarViews/DayView";
import MonthView from "./CalendarViews/MonthView";
import WeekView from "./CalendarViews/WeekView";
import SidePanel from "./SidePanel";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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

const CalendarView = ({ darkMode, mode, selectionType, selectedSymbol }) => {
  const [date, setDate] = useState(dayjs());
  const [monthInput, setMonthInput] = useState(date.format("MM"));
  const [yearInput, setYearInput] = useState(date.format("YYYY"));
  const [panelState, setPanelState] = useState({
    open: false,
    date: null,
    mode: null,
  });

  const handleYearInputBlur = () => {
    const y = parseInt(yearInput, 10);
    if (y >= 2020 && y <= 2025) setDate(dayjs().year(y));
    else setYearInput(date.format("YYYY"));
  };

  const handleMonthInputBlur = () => {
    const m = parseInt(monthInput, 10) - 1;
    const y = parseInt(yearInput, 10);
    if (m >= 0 && m < 12 && y >= 2020 && y <= 2025)
      setDate(dayjs().year(y).month(m).date(1));
    else {
      setMonthInput(date.format("MM"));
      setYearInput(date.format("YYYY"));
    }
  };

  const renderTopControls = (isYearOnly = false) => (
    <Box display="flex" justifyContent="center" alignItems="center" gap={5}>
      <IconButton
        onClick={() => {
          const newDate = date.subtract(1, isYearOnly ? "year" : "month");
          const lowerBound = dayjs("2020-01-01");

          if (!newDate.isBefore(lowerBound, isYearOnly ? "year" : "month")) {
            setDate(newDate);
            setYearInput(newDate.format("YYYY"));
            if (!isYearOnly) setMonthInput(newDate.format("MM"));
          }
        }}
        disabled={date.isSameOrBefore(
          dayjs("2020-01-01"),
          isYearOnly ? "year" : "month"
        )}
      >
        <ArrowBackIos />
      </IconButton>

      {!isYearOnly && (
        <TextField
          label="Month"
          type="number"
          size="small"
          value={monthInput}
          onChange={(e) => setMonthInput(e.target.value)}
          onBlur={handleMonthInputBlur}
          onKeyDown={(e) => e.key === "Enter" && handleMonthInputBlur()}
          inputProps={{ min: 1, max: 12 }}
          sx={{ width: 80 }}
        />
      )}

      <TextField
        label="Year"
        type="number"
        size="small"
        value={yearInput}
        onChange={(e) => setYearInput(e.target.value)}
        onBlur={handleYearInputBlur}
        onKeyDown={(e) => e.key === "Enter" && handleYearInputBlur()}
        inputProps={{ min: 2020, max: 2025 }}
        sx={{ width: 100 }}
      />

      <IconButton
        onClick={() => {
          const newDate = date.add(1, isYearOnly ? "year" : "month");
          const upperBound = dayjs("2025-12-31");

          if (!newDate.isAfter(upperBound, isYearOnly ? "year" : "month")) {
            setDate(newDate);
            setYearInput(newDate.format("YYYY"));
            if (!isYearOnly) setMonthInput(newDate.format("MM"));
          }
        }}
        disabled={date.isSameOrAfter(
          dayjs("2025-12-31"),
          isYearOnly ? "year" : "month"
        )}
      >
        <ArrowForwardIos />
      </IconButton>
    </Box>
  );

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
      {mode === "day" && selectionType === "single" && (
        <>
          {renderTopControls(false)}
          <DayView
            darkMode={darkMode}
            date={date}
            today={dayjs()}
            selectedSymbol={selectedSymbol}
            GlobalTooltip={GlobalTooltip}
            onCellClick={(d) =>
              setPanelState({ open: true, date: d, mode: "day" })
            }
          />
        </>
      )}

      {mode === "month" && selectionType === "single" && (
        <>
          {renderTopControls(true)}
          <MonthView
            darkMode={darkMode}
            date={date}
            selectedSymbol={selectedSymbol}
            GlobalTooltip={GlobalTooltip}
            onCellClick={(m) =>
              setPanelState({ open: true, date: m, mode: "month" })
            }
          />
        </>
      )}

      {mode === "week" && selectionType === "single" && (
        <>
          {renderTopControls(true)}
          <WeekView
            darkMode={darkMode}
            date={date}
            selectedSymbol={selectedSymbol}
            GlobalTooltip={GlobalTooltip}
            onCellClick={(range) =>
              setPanelState({ open: true, date: range, mode: "week" })
            }
          />
        </>
      )}

      <SidePanel
        open={panelState.open}
        onClose={() => setPanelState({ open: false, date: null, mode: null })}
        selectedDateInfo={panelState.date}
        selectedSymbol={selectedSymbol}
        mode={panelState.mode}
      />
    </Paper>
  );
};

export default CalendarView;
