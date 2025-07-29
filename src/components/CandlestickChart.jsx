import React, { useRef } from "react";
import {
  Chart,
  TimeScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
  CategoryScale,
  Title,
  Legend,
  PointElement,
  LineElement,
  LineController,
} from "chart.js";
import { Chart as ChartJSReact } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import "chartjs-adapter-date-fns";
import dayjs from "dayjs";

Chart.register(
  TimeScale,
  LinearScale,
  BarElement,
  BarController,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  CandlestickController,
  CandlestickElement,
  LineController,
  LineElement,
  PointElement
);

const CandlestickChart = ({
  ohlcvData,
  startDate,
  endDate,
  hideSMA = false,
  xAxisLabel = "Date",
}) => {
  const ohlcRef = useRef(null);
  const volumeRef = useRef(null);

  const isVisible = (timestamp) => {
    const time = dayjs(timestamp);
    const start = hideSMA
      ? dayjs(startDate).startOf("minute")
      : dayjs(startDate);
    const end = hideSMA ? dayjs(endDate).endOf("minute") : dayjs(endDate);
    return time.isSameOrAfter(start) && time.isSameOrBefore(end);
  };

  const allCandles = ohlcvData
    .filter((entry) => entry?.time && !isNaN(new Date(entry.time)))
    .map((entry) => ({
      x: new Date(entry.time),
      o: parseFloat(entry.open),
      h: parseFloat(entry.high),
      l: parseFloat(entry.low),
      c: parseFloat(entry.close),
    }));

  const visibleCandles = allCandles.filter((entry) => isVisible(entry.x));

  const volumeData = ohlcvData
    .filter((entry) => entry?.time && !isNaN(new Date(entry.time)))
    .map((entry) => ({
      x: new Date(entry.time),
      y: parseFloat(entry.volume),
    }))
    .filter((entry) => isVisible(entry.x));

  const smaData = [];
  for (let i = 19; i < allCandles.length; i++) {
    const slice = allCandles.slice(i - 19, i + 1);
    const avg = slice.reduce((sum, p) => sum + p.c, 0) / slice.length;
    const point = { x: allCandles[i].x, y: avg };
    if (isVisible(point.x)) {
      smaData.push(point);
    }
  }

  const syncZoom = (sourceChart) => {
    const target = sourceChart === "ohlc" ? volumeRef.current : ohlcRef.current;
    const source = sourceChart === "ohlc" ? ohlcRef.current : volumeRef.current;
    if (!source || !target) return;
    const sourceScale = source.scales.x;
    target.options.scales.x.min = sourceScale.min;
    target.options.scales.x.max = sourceScale.max;
    target.update("none");
  };

  const getBaseOptions = (chartType) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: false },
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
          onZoomComplete: () => syncZoom(chartType),
        },
        pan: {
          enabled: true,
          mode: "x",
          onPanComplete: () => syncZoom(chartType),
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: dayjs(endDate).diff(startDate, "hour") < 48 ? "hour" : "day",
          tooltipFormat: "yyyy-MM-dd HH:mm",
        },
        title: {
          display: true,
          text: xAxisLabel,
          font: { weight: "bold", size: 13 },
        },
      },
    },
  });

  const ohlcOptions = {
    ...getBaseOptions("ohlc"),
    scales: {
      ...getBaseOptions("ohlc").scales,
      y: {
        title: {
          display: true,
          text: "Price (USDT)",
          font: { weight: "bold", size: 13 },
        },
      },
    },
  };

  const volumeOptions = {
    ...getBaseOptions("volume"),
    scales: {
      ...getBaseOptions("volume").scales,
      y: {
        title: {
          display: true,
          text: "Volume",
          font: { weight: "bold", size: 13 },
        },
      },
    },
  };

  const ohlcDataset = {
    datasets: [
      {
        label: "OHLC",
        data: visibleCandles,
        type: "candlestick",
        borderColor: "rgba(0,0,0,0.3)",
        borderWidth: 1,
        barThickness: 4,
        color: {
          up: "#26a69a",
          down: "#ef5350",
          unchanged: "#ccc",
        },
      },
      ...(!hideSMA
        ? [
            {
              label: "SMA (20)",
              data: smaData,
              type: "line",
              borderColor: "#fdd835",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.2,
              yAxisID: "y",
            },
          ]
        : []),
    ],
  };

  const volumeDataset = {
    datasets: [
      {
        label: "Volume",
        data: volumeData,
        type: "bar",
        backgroundColor: "rgba(100,149,237,0.5)",
        barThickness: 4,
      },
    ],
  };

  return (
    <div>
      <div style={{ height: 350, marginBottom: 40 }}>
        <ChartJSReact
          ref={(chart) => (ohlcRef.current = chart)}
          type="candlestick"
          data={ohlcDataset}
          options={ohlcOptions}
        />
      </div>
      <div style={{ height: 150 }}>
        <ChartJSReact
          ref={(chart) => (volumeRef.current = chart)}
          type="bar"
          data={volumeDataset}
          options={volumeOptions}
        />
      </div>
    </div>
  );
};

export default CandlestickChart;
