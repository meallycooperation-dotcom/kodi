import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';

type SeoHighlightsProps = {
  totalCollected: number;
  totalArrears: number;
  trackedTenants: number;
  latestMonth?: string;
};

const SeoHighlights = ({ totalCollected, totalArrears, trackedTenants, latestMonth }: SeoHighlightsProps) => {
  const monthLabel = latestMonth
    ? new Date(`${latestMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })
    : 'the latest period';

  return (
    <section className="seo-hero card" aria-label="Rent intelligence highlights">
      <div>
        <p className="seo-hero__eyebrow">Rent management intelligence</p>
        <h2>Control every tenant payment from one Kenyan-shilling native dashboard</h2>
        <p>
          Kodi keeps tenant payments, overdue balances, and analytics in sync so you can see {trackedTenants}{' '}
          tracked residences, collect {formatCurrency(totalCollected)} in the latest period, and monitor arrears in
          real time.
        </p>
        <ul className="seo-hero__list">
          <li>Transparent tenant ledger that lists amounts due, amounts paid, and statuses for every unit.</li>
          <li>Automated arrears tracking alerts you when tenants fall behind, backed by live rent fees.</li>
          <li>Actionable analytics and reminders to close gaps between expected and collected rent each month.</li>
        </ul>
      </div>
      <div className="seo-hero__links">
        <p className="text-sm text-gray-500">Freshest data updated for {monthLabel}</p>
        <Link to="/rent-paid" className="seo-hero__link">
          Review tenant payments
        </Link>
        <Link to="/rent-arrears" className="seo-hero__link">
          Inspect overdue balances
        </Link>
        <Link to="/analytics" className="seo-hero__link">
          Deep dive into property analytics
        </Link>
      </div>
    </section>
  );
};

export default SeoHighlights;
