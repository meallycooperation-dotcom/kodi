const Help = () => (
  <section className="space-y-6">
    <div className="page-header">
      <div>
        <h1>Help & onboarding</h1>
        <p className="text-gray-500">
          Learn the essentials of Kodi with this short walkthrough and find links to the docs
          you need.
        </p>
      </div>
    </div>

    <div className="card space-y-4">
      <div>
        <h2>Onboarding video</h2>
        <p className="text-sm text-gray-500">
          Watch the official Kodi onboarding walkthrough to understand how the dashboard is
          structured and where to manage your portfolio, tenants, and payments.
        </p>
      </div>
      <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src="https://www.youtube.com/embed/6qCbduvFQ-g"
          title="Kodi onboarding video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  </section>
);

export default Help;
