type RevenueChartProps = {
  summary?: string;
};

const RevenueChart = ({ summary }: RevenueChartProps) => (
  <div className="chart-placeholder">
    <p>Revenue Chart</p>
    {summary && <strong>{summary}</strong>}
  </div>
);

export default RevenueChart;
