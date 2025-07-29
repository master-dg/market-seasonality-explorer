# 📊 Market Seasonality Explorer

An interactive financial calendar app to visualize **volatility**, **liquidity**, and **performance metrics** across multiple timeframes (Day, Week, Month, Custom Period) using real-time Binance market data.

---

## 🚀 Features

### 📆 Calendar Modes

* **Day View**: Daily OHLC data with:

  * Volatility heatmap (Green = Low, Yellow = Medium, Red = High)
  * Volume bars
  * Performance arrows (▲/▼/•)
* **Week View**: Weekly summaries in a 7x8 matrix grid
* **Month View**: Monthly performance in a 4x3 layout
* **Period View**: Custom date-range analysis with advanced charting

### 📊 Data Visualizations

* **Candlestick Chart** with optional SMA overlay
* **Volume bar chart** with synchronized zoom/pan
* **Interactive Tooltips** showing price, volatility, volume

### 📂 Side Panel

* Pops open on date/month/week click
* Displays OHLC summary and charts for the selected range

### 🧭 Controls

* Toggle between:

  * Day / Week / Month / Period views
  * Single selection or custom period
* Symbol selector (live from Binance API)
* Dark mode support

---

## 💠 Tech Stack

| Tool/Library                | Description                                   |
| --------------------------- | --------------------------------------------- |
| **React**                   | Frontend framework                            |
| **Material-UI (MUI)**       | UI components & styling                       |
| **Chart.js**                | Candlestick and bar charts (with zoom plugin) |
| **chartjs-chart-financial** | Financial chart extensions for Chart.js       |
| **dayjs**                   | Date handling and formatting                  |
| **Binance API**             | Live OHLCV & exchange metadata                |

---

## 📦 Installation

```bash
git clone https://github.com/master-dg/market-seasonality-explorer.git
cd market-seasonality-explorer
npm install
npm start
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── CalendarView.jsx        # View router for all modes
│   ├── SelectionPanel.jsx      # Header for view/mode/symbol selection
│   ├── SidePanel.jsx           # Slide-in panel showing OHLC summary
│   ├── CandlestickChart.jsx    # Combined OHLC + volume chart
│   ├── PeriodView.jsx          # Custom period picker + detailed charting
│   └── CalendarViews/
│       ├── DayView.jsx         # Daily calendar with heatmap and metrics
│       ├── WeekView.jsx        # Week-wise matrix with hover/click features
│       └── MonthView.jsx       # Month-wise performance grid
│
├── index.js                   # Entry point
├── App.js                     # App layout
├── App.css                    # App-wide styling
├── index.css                  # Base styling
```

---

## 🔌 External APIs

* **Binance Exchange Info**: For symbol dropdown
* **Binance Klines**: For OHLCV data fetching per interval

---

## 🧪 Testing

Test cases can be added inside `App.test.js` using `react-testing-library` and `jest`.

---

## 🌔 Theming

* Auto-adaptive to dark/light mode using MUI themes.
* Theme toggle with animated icons in the header (if integrated).

---

## 📊 Sample Metrics Visualized

* **Volatility**: (High - Low) per candle
* **Volume**: Summed volume per timeframe
* **Performance**: (Close - Open) % return
* **SMA**: 20-period simple moving average

---

## 🚣 Future Enhancements (Suggested)

* RSI and VIX-like overlays
* Custom color themes
* Export to CSV/PDF
* Notification alerts
* Side-by-side symbol comparison
* Mobile UI optimization

