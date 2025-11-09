export type Option = {
  id: string;
  label: string;
  description: string;
  value: string;
};

export type BaseQuestion = {
  id: string;
  title: string;
  prompt: string;
  helper?: string;
  required?: boolean;
};

export type SingleQuestion = BaseQuestion & {
  type: "single";
  options: Option[];
};

export type MultiQuestion = BaseQuestion & {
  type: "multi";
  options: Option[];
  minSelections?: number;
  maxSelections?: number;
};

export type TextQuestion = BaseQuestion & {
  type: "text";
  placeholder?: string;
};

export type Question = SingleQuestion | MultiQuestion | TextQuestion;

export const questions: Question[] = [
  {
    id: "budget",
    title: "Budget & financing comfort zone",
    prompt:
      "How would you describe the budget you are comfortable with for your teen’s car?",
    helper:
      "Consider total purchase price, financing, and insurance costs you’d be comfortable authorizing today.",
    type: "single",
    options: [
      {
        id: "budget-value",
        label: "Value-first purchase",
        description:
          "Prioritize reliability and total cost of ownership under $18K. OK with higher mileage if documented.",
        value: "value",
      },
      {
        id: "budget-certified",
        label: "Certified pre-owned sweet spot",
        description:
          "Prefer 1–3 year old vehicles with warranties intact. Budget $18K–$28K and flexible on trims.",
        value: "cpo-balance",
      },
      {
        id: "budget-premium",
        label: "Premium peace of mind",
        description:
          "Willing to invest $28K+ for top-tier safety, tech, and dealer service history.",
        value: "premium",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & crash-test expectations",
    prompt: "What describes your minimum safety threshold?",
    helper:
      "Think about the crash ratings, driver assistance, and insurance implications that make you confident handing over the keys.",
    type: "single",
    options: [
      {
        id: "safety-essential",
        label: "Essential protections",
        description:
          "NHTSA 4★ minimum, rear camera, and stability control are must-haves. ADAS is a bonus.",
        value: "baseline-safety",
      },
      {
        id: "safety-advanced",
        label: "Advanced driver assistance",
        description:
          "Requires blind-spot, lane-keep, and automatic emergency braking with strong IIHS ratings.",
        value: "advanced-adas",
      },
      {
        id: "safety-max",
        label: "Maximum assurance",
        description:
          "Top Safety Pick+, teen driver monitoring, crash avoidance suites, and excellent insurance loss results.",
        value: "max-safety",
      },
    ],
  },
  {
    id: "usage",
    title: "How your teen will use the car",
    prompt: "What best matches how the car will be used week-to-week?",
    helper:
      "We’ll use this to balance city vs. highway mileage, storage, and the convenience features you’ll actually use.",
    type: "single",
    options: [
      {
        id: "usage-commute",
        label: "Daily commute & errands",
        description:
          "Focus on fuel efficiency, easy parking, and durable interiors for constant in-and-out use.",
        value: "daily-commute",
      },
      {
        id: "usage-shared",
        label: "Shared family duty",
        description:
          "Needs flexible seating, cargo room, and comfort for longer trips with siblings or teammates.",
        value: "shared-family",
      },
      {
        id: "usage-adventure",
        label: "Weekend adventures",
        description:
          "Prioritize all-weather confidence, roof/cargo mounts, and infotainment to make road trips fun.",
        value: "adventure",
      },
    ],
  },
  {
    id: "tech",
    title: "Tech & convenience priorities",
    prompt: "Which tech package feels essential for your family?",
    helper:
      "We’ll balance driver coaching features with the infotainment and remote tools you expect.",
    type: "single",
    options: [
      {
        id: "tech-core",
        label: "Core connectivity",
        description:
          "Apple CarPlay/Android Auto, USB-C, and basic drive mode selectors. Teen can learn without distractions.",
        value: "core-connectivity",
      },
      {
        id: "tech-monitoring",
        label: "Teen monitoring suite",
        description:
          "Built-in speed alerts, geofencing, remote start, and app control for coaching while you’re away.",
        value: "monitoring-suite",
      },
      {
        id: "tech-lux",
        label: "Premium tech experience",
        description:
          "Heads-up display, surround view cameras, premium audio, and adaptive cruise so every ride feels modern.",
        value: "premium-tech",
      },
    ],
  },
  {
    id: "timeline",
    title: "Timeline & readiness",
    prompt: "How quickly do you plan to finalize a vehicle?",
    helper:
      "Understanding timing helps us decide whether to surface nationwide inventory or local test drives first.",
    type: "single",
    options: [
      {
        id: "timeline-urgent",
        label: "Within 2 weeks",
        description:
          "Need ready-to-drive options immediately, ideally available locally with minimal paperwork.",
        value: "two-weeks",
      },
      {
        id: "timeline-month",
        label: "Within 30–45 days",
        description:
          "Open to a broader search radius and flexible financing conversations to find the right fit.",
        value: "month",
      },
      {
        id: "timeline-research",
        label: "Still researching",
        description:
          "Want education, benchmarks, and practice negotiations before committing to a shortlist.",
        value: "researching",
      },
    ],
  },
  {
    id: "extras",
    title: "Unique preferences & feel-good factors",
    prompt: "Do you have any other must-haves that define the right fit?",
    helper:
      "These signals help us source options that align with your family’s values and the driving experience your teen will enjoy.",
    type: "multi",
    minSelections: 1,
    options: [
      {
        id: "extras-american",
        label: "American-made confidence",
        description: "Support domestic manufacturing and easier parts availability.",
        value: "american-made",
      },
      {
        id: "extras-bright",
        label: "Bright exterior colors",
        description:
          "Eye-catching finishes to increase visibility to other drivers and make the car easy to spot.",
        value: "bright-color",
      },
      {
        id: "extras-eco",
        label: "Eco-conscious pick",
        description:
          "Hybrid, plug-in hybrid, or highly efficient powertrains to keep fuel costs and emissions low.",
        value: "eco-conscious",
      },
      {
        id: "extras-certified",
        label: "Dealer certified only",
        description:
          "Must come with dealer-backed warranties, inspections, and roadside assistance programs.",
        value: "certified-only",
      },
      {
        id: "extras-flexible",
        label: "Open to the best match",
        description:
          "No strong preference—prioritize the overall score across safety, cost, and availability.",
        value: "flexible",
      },
    ],
  },
  {
    id: "notes",
    title: "Anything else your concierge should know?",
    prompt:
      "Share specific models to avoid, non-negotiable features, or any context you want our AI agent to keep in mind.",
    helper:
      "We’ll attach these notes to your profile so recommendations always reflect your family’s voice.",
    type: "text",
    required: false,
    placeholder:
      "Example: Avoid recalled models from 2016–2018. Needs rear-seat airbags. Teen is 6'2\" so headroom matters.",
  },
];

