type KPIStat = {
  label: string;
  value: string;
};

const defaultStats: KPIStat[] = [
  { label: 'Occupancy', value: '92%' },
  { label: 'Collection rate', value: '98%' },
  { label: 'Avg. rent', value: 'Ksh. 1,150' }
];

type KPIStatsProps = {
  stats?: KPIStat[];
  loading?: boolean;
};

const KPIStats = ({ stats = defaultStats, loading = false }: KPIStatsProps) => (
  <div className="kpi-grid">
    {stats.map((stat) => (
      <article key={stat.label} className="kpi-item">
        <p className="kpi-value">
          {loading ? (
            <span className="inline-block h-6 w-24 animate-pulse rounded bg-gray-200" aria-hidden="true" />
          ) : (
            stat.value
          )}
        </p>
        <small>{stat.label}</small>
      </article>
    ))}
  </div>
);

export default KPIStats;
