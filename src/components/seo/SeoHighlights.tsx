import { Link } from 'react-router-dom';

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
