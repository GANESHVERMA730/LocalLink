import { Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Star,
  Zap,
  Wrench,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CategoryIcon } from '@/components/Icon';
import { SERVICE_CATEGORIES } from '@/constants/categories';

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/80 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-accent-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-primary-700 shadow-card">
              <Sparkles size={16} />
              Trusted local pros, one tap away
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Find and book trusted
              <span className="block bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                local service providers
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">
              Plumbers, electricians, tutors, cleaners and more — search by location, compare
              ratings, book instantly, and chat in real time. No phone tag, no guesswork.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">
                Find Services
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn-secondary px-6 py-3 text-base">
                Become a provider
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-400">
              Free to join. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">Every service, one platform</h2>
          <p className="mt-2 text-ink-500">Browse the categories our providers offer</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SERVICE_CATEGORIES.slice(0, 12).map((cat) => (
            <div
              key={cat.value}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                <CategoryIcon name={cat.icon} className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-ink-700">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">How LocalLink works</h2>
            <p className="mt-2 text-ink-500">Three steps from search to scheduled</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Step
              icon={<Search />}
              step="01"
              title="Search nearby"
              description="Use your location or an address to find verified providers within your radius. Filter by category, rating, and availability."
            />
            <Step
              icon={<Calendar />}
              step="02"
              title="Book a slot"
              description="Pick a service, choose a time, and send a booking request. Providers respond and accept — you'll see the status update live."
            />
            <Step
              icon={<MessageSquare />}
              step="03"
              title="Chat in real time"
              description="Coordinate details with your provider through in-app chat. No sharing your personal number until you're ready."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
              Built for trust and convenience
            </h2>
            <p className="mt-4 text-ink-600">
              Every provider is a real local business or professional. Search with confidence,
              book with clarity, and communicate without friction.
            </p>
            <div className="mt-8 space-y-5">
              <Feature icon={<ShieldCheck />} title="Verified providers" description="Profiles show verification status and ratings from completed bookings." />
              <Feature icon={<MapPin />} title="Location-aware search" description="Geospatial search ranks providers by actual distance from you — not just city." />
              <Feature icon={<Zap />} title="Real-time updates" description="Booking status changes and chat messages arrive instantly, no refresh needed." />
              <Feature icon={<Star />} title="Ratings you can trust" description="Ratings reflect completed work, not anonymous clicks." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Wrench size={20} />
              </div>
              <p className="mt-4 text-3xl font-bold text-ink-900">12+</p>
              <p className="text-sm text-ink-500">Service categories</p>
            </div>
            <div className="card mt-8 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                <Star size={20} />
              </div>
              <p className="mt-4 text-3xl font-bold text-ink-900">Live</p>
              <p className="text-sm text-ink-500">Real-time chat</p>
            </div>
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <GraduationCap size={20} />
              </div>
              <p className="mt-4 text-3xl font-bold text-ink-900">2 roles</p>
              <p className="text-sm text-ink-500">Customer & provider</p>
            </div>
            <div className="card mt-8 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                <MapPin size={20} />
              </div>
              <p className="mt-4 text-3xl font-bold text-ink-900">Geo</p>
              <p className="text-sm text-ink-500">Distance-ranked</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-primary-100">
            Join LocalLink today — whether you need a service or provide one.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="btn bg-white px-6 py-3 text-base text-primary-700 hover:bg-primary-50"
            >
              Create your account
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="btn border border-primary-400 px-6 py-3 text-base text-white hover:bg-primary-600"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-display font-bold text-ink-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
              <MapPin size={16} />
            </span>
            LocalLink
          </div>
          <p className="text-sm text-ink-400">
            Connecting communities with trusted local professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({ icon, step, title, description }) {
  return (
    <div className="relative rounded-2xl bg-white p-8 shadow-card">
      <div className="absolute right-6 top-6 text-4xl font-bold text-ink-100">{step}</div>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-500">{description}</p>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>
    </div>
  );
}
