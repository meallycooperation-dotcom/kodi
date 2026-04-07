import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Shield,
  Clock,
  Smartphone,
  Landmark,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Sparkles
} from 'lucide-react';

type LandingPageProps = {
  onSeen: () => void;
};

const featureHighlights = [
  {
    title: 'Automated rent collection',
    description: 'Send SMS, email, and WhatsApp reminders that align with Kenyan rent cycles, then reconcile payments across MPesa, bank transfers, and upgrades.',
    detail: 'Track every payment, flag pending receipts, and export landlord-ready reports instantly.',
    icon: Landmark,
    gradient: 'from-slate-100 to-slate-200'
  },
  {
    title: 'Tenant relationship center',
    description: 'Store tenant documents, move-in dates, and arrears history in one shared workspace so you can pull up conversations or sign renewals without hunting for email threads.',
    detail: 'Segment tenants by building, payment cadence, or status and trigger tailored notifications.',
    icon: Users,
    gradient: 'from-slate-100 to-slate-200'
  },
  {
    title: 'Operational analytics',
    description: 'Surface vacancy, rent growth, and collection health through intuitive dashboards built for property owners and on-the-go managers.',
    detail: 'See trends by property, track operational expenses, and predict cash flow before the month closes.',
    icon: BarChart3,
    gradient: 'from-slate-100 to-slate-200'
  }
];

const quickStats = [
  { label: 'Properties managed', value: '250+', icon: Building2 },
  { label: 'Rent units tracked', value: '4,500+', icon: Users },
  { label: 'Collections secured', value: 'KES 5M+', icon: TrendingUp }
];

const benefits = [
  { icon: Shield, text: 'Secure & Compliant', description: 'Fully compliant with Kenyan tax regulations' },
  { icon: Clock, text: 'Real-time Updates', description: 'Instant notifications and payment tracking' },
  { icon: Smartphone, text: 'Mobile Optimized', description: 'Manage everything from your phone' }
];

const LandingPage = ({ onSeen }: LandingPageProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const featureList = useMemo(
    () => [
      'Centralized rent ledger for every tenant/account',
      'Custom reminders that land in Mpesa Push or WhatsApp',
      'Automated arrears nudges and receipts distribution',
      'Insightful analytics on portfolio performance',
      'Seamless integration with Kenyan payment systems',
      '24/7 dedicated support for property managers'
    ],
    []
  );

  const handleNavigation = (path: string) => {
    onSeen();
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img
                src="/images/favicon.png"
                alt="Kodi logo"
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900">Kodi</span>
                <span className="text-sm font-medium text-slate-500 hidden sm:inline">Rent Management</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#benefits" className="text-slate-600 hover:text-blue-600 transition-colors">Benefits</a>
              <a href="#stats" className="text-slate-600 hover:text-blue-600 transition-colors">Stats</a>
               <button
                 onClick={() => handleNavigation('/auth/login')}
                 className="text-slate-600 hover:text-blue-600 transition-colors"
               >
                Login
              </button>
               <button
                 onClick={() => handleNavigation('/auth/signup')}
                 className="bg-gradient-to-r from-blue-600 to-sky-500 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
               >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200">
            <div className="px-4 py-3 space-y-2">
              <a href="#features" className="block py-2 text-slate-600 hover:text-blue-600">Features</a>
              <a href="#benefits" className="block py-2 text-slate-600 hover:text-blue-600">Benefits</a>
              <a href="#stats" className="block py-2 text-slate-600 hover:text-blue-600">Stats</a>
              <button
                onClick={() => handleNavigation('/auth/login')}
                className="w-full text-left py-2 text-slate-600 hover:text-blue-600"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigation('/auth/signup')}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white px-4 py-2 rounded-full font-semibold"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-sky-50 opacity-50" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  <Sparkles className="h-4 w-4 mr-2 text-slate-900" />
                  Rent management, reimagined for Kenya
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Centralize tenant payments,{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                    arrears tracking
                  </span>
                  , and property analytics
                </h1>
                
                <p className="text-lg text-slate-600 leading-relaxed">
                  Kodi automates reminders, reconciles receipts, and stitches every property metric into a single narrative so you can scale your portfolio without juggling spreadsheets or late fees.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleNavigation('/auth/signup')}
                    className="group bg-gradient-to-r from-blue-600 to-sky-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                  >
                    Start for free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleNavigation('/auth/login')}
                    className="border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-full font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    Explore dashboard
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
                        <benefit.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{benefit.text}</p>
                        <p className="text-sm text-slate-500">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/apartment.webp"
                    alt="Dashboard preview"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-slate-900" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">98% Collection Rate</p>
                      <p className="text-xs text-slate-500">Average across all properties</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Powerful features for{' '}
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  modern property management
                </span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Everything you need to manage your rental properties efficiently and professionally
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featureHighlights.map((feature, idx) => (
                <div
                  key={feature.title}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100"
                >
                  <div className="absolute inset-0 bg-slate-200 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                  <div className="h-12 w-12 rounded-xl bg-slate-900 p-2.5 mb-6 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">{feature.description}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-slate-900" />
                    {feature.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Kodi Works Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  Why Kodi works
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Everything you need to run rent,{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                    confidently and compliantly
                  </span>
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Kodi connects rent collection, tenant management, reminders, and analytics so every stakeholder sees the same truth. From new tenant onboarding to reporting arrears to investors, spend seconds, not hours.
                </p>
                
                <div className="space-y-4">
                  {featureList.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-slate-900 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleNavigation('/auth/signup')}
                  className="group bg-gradient-to-r from-blue-600 to-sky-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  Start managing your properties
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="grid gap-6">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/rental.jpg"
                    alt="Dashboard analytics"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-slate-900" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Trusted by 250+</p>
                        <p className="text-xs text-slate-500">Property managers</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                  <img
                    src="/images/airbnb.jpg"
                    alt="Stylish short-term rental"
                    className="h-64 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-6 space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Short-term ready</p>
                    <h3 className="text-xl font-semibold text-slate-900">Operate Airbnb and serviced stays</h3>
                    <p className="text-sm text-slate-600">
                      Automate check-in reminders, sync availability, and capture receipts for every short-term booking so nothing slips through the cracks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-lg transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-900 p-2.5 mx-auto mb-4 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</p>
                  <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img
                  src="/images/favicon.png"
                  alt="Kodi logo"
                  className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                />
                <span className="text-xl font-bold">Kodi</span>
              </div>
              <p className="text-slate-400 text-sm">
                Modern rent management for Kenyan property professionals
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-blue-400 transition-colors">Benefits</a></li>
                <li><a href="#stats" className="hover:text-blue-400 transition-colors">Statistics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:meallycooperation@gmail.com" className="hover:text-blue-400 transition-colors">
                    meallycooperation@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+254700555010" className="hover:text-blue-400 transition-colors">
                    +254 11 222 4991
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <a href="https://wa.me/254112224991" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
                    WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Kodi Rent Management. Built for landlords and property managers in Kenya.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
