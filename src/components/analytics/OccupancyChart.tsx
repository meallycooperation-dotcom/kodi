type OccupancyChartProps = {
  summary?: string;
};

const OccupancyChart = ({ summary }: OccupancyChartProps) => (
  <div className="chart-placeholder">
    <p>Occupancy Chart</p>
    {summary && <strong>{summary}</strong>}
  </div>
);

export default OccupancyChart;
