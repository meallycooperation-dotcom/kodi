import { Mail, Phone, MessageCircle } from 'lucide-react';

const Help = () => (
  <section className="space-y-6">
    <div className="page-header">
      <div>
        <h1>contact support</h1>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <a
        href="mailto:meallycooperation@gmail.com"
        className="card flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-slate-900" />
          <span className="text-sm font-medium text-gray-500">Email</span>
        </div>
        <p className="text-xs text-gray-400">Send a quick message</p>
      </a>
      <a href="tel:0112224991" className="card flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Phone className="h-6 w-6 text-slate-900" />
          <span className="text-sm font-medium text-gray-500">Phone</span>
        </div>
        <p className="text-xs text-gray-400">Call us for support</p>
      </a>
      <a
        href="https://wa.me/0112224991"
        target="_blank"
        rel="noreferrer"
        className="card flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-slate-900" />
          <span className="text-sm font-medium text-gray-500">WhatsApp</span>
        </div>
        <p className="text-xs text-gray-400">Chat in WhatsApp</p>
      </a>
    </div>

    <div className="space-y-1">
      <h2 className="text-lg font-semibold">Help & onboarding</h2>
      <p className="text-gray-500">
        Learn the essentials of Kodi with this short walkthrough and find links to the docs you need.
      </p>
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
