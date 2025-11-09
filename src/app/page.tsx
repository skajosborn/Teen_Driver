import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Safety-First Filters",
      description:
        "Set the crash-test ratings, advanced driver assistance features, and insurance thresholds you expect.",
    },
    {
      title: "Smart Budget Guardrails",
      description:
        "Dial in purchase price, monthly payment, and maintenance costs to stay in your comfort zone.",
    },
    {
      title: "Family Fit Factors",
      description:
        "Prioritize seating, cargo needs, mileage, and style so your teen loves the car—and you love the decision.",
    },
  ];

  const steps = [
    {
      label: "Tell us what matters",
      detail:
        "Share your safety must-haves, budget range, driving habits, and any red lines.",
    },
    {
      label: "We scout the market",
      detail:
        "Our agentic engine scans dealer lots, certified pre-owned inventory, and owner-reported data.",
    },
    {
      label: "Review your short list",
      detail:
        "Get a concise report with pros/cons, negotiation insights, and next steps for each match.",
    },
  ];

  const faqs = [
    {
      question: "How accurate are the recommendations?",
      answer:
        "We combine federal safety data, insurance studies, and live inventory feeds to surface cars that match your exact criteria.",
    },
    {
      question: "Can I refine the list after the first run?",
      answer:
        "Absolutely. Adjust any parameter and regenerate in seconds—your history and notes stay synced.",
    },
    {
      question: "Does this replace talking to a dealer?",
      answer:
        "Think of Teen Driver as your research partner. We prep you with the right questions, offers, and confidence before you walk into a showroom.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="absolute right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/90 text-lg font-semibold text-slate-950 shadow-lg shadow-sky-500/30">
              TD
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Teen Driver</p>
              <p className="text-sm text-slate-300">
                Confidence for parents. Excitement for teens.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a className="transition-colors hover:text-white" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-white" href="#how-it-works">
              How it works
            </a>
            <a className="transition-colors hover:text-white" href="#faq">
              FAQ
            </a>
            <Link
              className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-100"
              href="/quiz"
            >
              Get started
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-10 sm:px-10 lg:flex-row lg:items-start">
          <section className="flex-1 space-y-10">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.75rem] lg:leading-[1.05]">
            Smart technology. Peace of mind. The perfect car awaits.
            </h1>
            <p className="max-w-lg text-lg text-slate-300 sm:text-xl">
              Backed by real NHTSA crash tests, insurance costs, and an agentic concierge designed for cautious families.
            </p>
            <div className="relative mt-4 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-slate-950/60 sm:max-w-md lg:max-w-lg">
              <Image
                src="/car6.jpg"
                alt="Toyota SUV parked in low light"
                width={960}
                height={640}
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-slate-950/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 backdrop-blur">
                Powered by safety data, not ads
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/quiz"
                className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 hover:shadow-sky-400/40"
              >
                Build my teen&apos;s shortlist
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                See how it works →
              </a>
            </div>
          </section>

          <aside
            id="get-started"
            className="w-full max-w-md shrink-0 space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                One quiz captures it all
              </h2>
              <p className="text-sm text-slate-200">
                Answer once and every preference flows straight into your AI concierge—no duplicate forms.
              </p>
            </div>
            <ul className="space-y-4 text-sm text-slate-200">
              <li className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                <div>
                  <p className="font-semibold text-white">Budget guardrails</p>
                  <p className="text-slate-300">
                    Define value-first, CPO comfort, or premium assurance—down to the dollar range that fits.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-semibold text-white">Safety & usage priorities</p>
                  <p className="text-slate-300">
                    Choose the crash ratings, ADAS tech, and daily driving scenarios that matter for your teen.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-purple-400" />
                <div>
                  <p className="font-semibold text-white">Feel-good extras</p>
                  <p className="text-slate-300">
                    Flag preferences like American-made confidence, higher seating, bright colors, or eco-first options.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                <div>
                  <p className="font-semibold text-white">Special requests</p>
                  <p className="text-slate-300">
                    Add notes about models to avoid, insurance considerations, or timeline constraints.
                  </p>
                </div>
              </li>
            </ul>
            <div className="space-y-3">
              <Link
                href="/quiz"
                className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400"
              >
                Start the parent quiz
              </Link>
              <p className="text-center text-xs text-slate-400">
                Takes about 90 seconds. Your answers power every recommendation.
              </p>
            </div>
          </aside>
        </main>

        <section
          id="features"
          className="mx-auto mb-24 max-w-6xl px-6 sm:px-10"
        >
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-sky-400">
                  ●
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        id="how-it-works"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 sm:px-10"
      >
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          How Teen Driver guides your decision
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-sky-400">
                Step {index + 1}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-white">{step.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900 to-slate-900/70 p-8 sm:grid-cols-3">
          <div>
            <p className="text-4xl font-semibold text-white">92%</p>
            <p className="mt-2 text-sm text-slate-300">
              of parents felt more confident negotiating after using Teen Driver.
            </p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">3.5 hrs</p>
            <p className="mt-2 text-sm text-slate-300">
              average research time saved per family in the first week.
            </p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">4.9 ★</p>
            <p className="mt-2 text-sm text-slate-300">
              satisfaction across concierge calls and shortlist reports.
            </p>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-6xl space-y-8 px-6 pb-24 sm:px-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              FAQs for vigilant parents
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Straight answers to the most common questions we hear.
            </p>
          </div>
          <a
            href="mailto:hello@teendriver.ai"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white"
          >
            Still curious? Email us →
          </a>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
            >
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p>© {new Date().getFullYear()} Teen Driver. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-white" href="#">
              Privacy
            </a>
            <a className="transition hover:text-white" href="#">
              Terms
            </a>
            <a className="transition hover:text-white" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
