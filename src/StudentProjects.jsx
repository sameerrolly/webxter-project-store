import React, { useState, useRef, useEffect, useCallback } from "react";
import "./StudentProjects.css";

// ─── SVG Icon Library ─────────────────────────────────────────────────────────
const Icon = {
  GraduationCap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Package: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Settings: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Target: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Zap: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Award: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  Shield: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Users: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Cart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Mail: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Phone: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  ),
};

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Web Development", "Mobile", "Data Science", "AI/ML", "Desktop", "IoT"];

const PROJECTS = [
  {
    id: 1,
    title: "Library Management System",
    description:
      "Complete library management with book tracking, member management, and automated fine calculation.",
    category: "Web Development",
    tags: ["React", "Django", "PostgreSQL"],
    level: "Intermediate",
    delivery: "1 week",
    originalPrice: 15000,
    price: 9999,
    features: ["Book Catalog", "Member Management", "Issue/Return System", "Fine Calculation"],
    badge: "Popular",
  },
  {
    id: 2,
    title: "Hardware Store Management",
    description:
      "Inventory management system for hardware stores with billing and stock tracking.",
    category: "Web Development",
    tags: ["Next.js", "Django", "MySQL"],
    level: "Advanced",
    delivery: "1 week",
    originalPrice: 19000,
    price: 14999,
    features: ["Inventory Tracking", "Billing System", "Supplier Management", "Reports"],
    badge: null,
  },
  {
    id: 3,
    title: "Code Collaboration Platform",
    description:
      "Real-time code sharing and collaboration platform with version control.",
    category: "Web Development",
    tags: ["React", "Node.js", "Socket.io"],
    level: "Advanced",
    delivery: "2–3 weeks",
    originalPrice: 25000,
    price: 14999,
    features: ["Real-time Editing", "Version Control", "Chat System", "Project Management"],
    badge: "Hot",
  },
  {
    id: 4,
    title: "Hospital Management System",
    description:
      "Comprehensive hospital management with patient records, appointments, and billing.",
    category: "Web Development",
    tags: ["Django", "React", "PostgreSQL"],
    level: "Advanced",
    delivery: "1 week",
    originalPrice: 19000,
    price: 14999,
    features: ["Patient Records", "Appointment System", "Billing", "Doctor Management"],
    badge: null,
    soldOut: true,
  },
  {
    id: 5,
    title: "Inventory Management System",
    description:
      "Advanced inventory tracking with analytics, alerts, and multi-location support.",
    category: "Web Development",
    tags: ["React", "Django", "Redis"],
    level: "Intermediate",
    delivery: "1–2 weeks",
    originalPrice: 15500,
    price: 12999,
    features: ["Multi-location", "Analytics", "Alerts", "Barcode Support"],
    badge: null,
  },
  {
    id: 6,
    title: "AI ChatBot System",
    description:
      "Intelligent chatbot with natural language processing and learning capabilities.",
    category: "AI/ML",
    tags: ["Python", "TensorFlow", "Flask"],
    level: "Expert",
    delivery: "1 week",
    originalPrice: 20500,
    price: 14999,
    features: ["NLP Processing", "Learning Algorithm", "Multi-platform", "Analytics"],
    badge: "New",
  },
  {
    id: 7,
    title: "Expense Tracker App",
    description:
      "Mobile-first expense tracking app with charts, budgets, and category management.",
    category: "Mobile",
    tags: ["React Native", "Firebase"],
    level: "Beginner",
    delivery: "3–5 days",
    originalPrice: 10000,
    price: 7499,
    features: ["Budget Tracking", "Charts", "Categories", "Export Reports"],
    badge: null,
  },
  {
    id: 8,
    title: "Stock Price Prediction",
    description:
      "ML-powered stock price prediction using LSTM neural networks and historical data.",
    category: "Data Science",
    tags: ["Python", "Keras", "Pandas"],
    level: "Expert",
    delivery: "1–2 weeks",
    originalPrice: 22000,
    price: 16999,
    features: ["LSTM Model", "Live Data", "Visualization", "Backtesting"],
    badge: "Popular",
  },
];

const LEVEL_COLORS = {
  Beginner: "#22c55e",
  Intermediate: "#f59e0b",
  Advanced: "#ef4444",
  Expert: "#8b5cf6",
};

const TESTIMONIALS = [
  {
    name: "Rahul Sharma",
    college: "IIT Delhi",
    project: "Library Management System",
    rating: 5,
    text: "Excellent project with clean code and detailed documentation. Helped me understand full-stack development concepts.",
    avatar: "RS",
  },
  {
    name: "Priya Patel",
    college: "NIT Surat",
    project: "Hospital Management",
    rating: 5,
    text: "The custom project development service was amazing. They delivered exactly what I needed for my final year project.",
    avatar: "PP",
  },
  {
    name: "Amit Kumar",
    college: "VIT Vellore",
    project: "ChatBot System",
    rating: 5,
    text: "Great learning experience during the internship. Got hands-on experience with AI/ML technologies.",
    avatar: "AK",
  },
];

// ─── Marquee Banner ───────────────────────────────────────────────────────────
function MarqueeBanner() {
  const item = (
    <span className="wx-marquee__item">
      <Icon.GraduationCap />
      20% OFF for Final Year Students!
    </span>
  );
  const items = Array.from({ length: 25 }, (_, i) => (
    <React.Fragment key={i}>{item}</React.Fragment>
  ));
  return (
    <div className="wx-marquee" aria-hidden="true">
      <div className="wx-marquee__track">
        {items}{items}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="wx-navbar">
      <div className="wx-container wx-navbar__inner">
        <a className="wx-navbar__logo" href="https://webxter.in">
          <video autoPlay loop playsInline width="50" height="50">
            <source src="/webxter-preloader.mp4" type="video/mp4" />
            <img alt="logo" width="50" height="50" src="/favicon-extra-space.svg" />
          </video>
          <img alt="logo" className="wx-logo-wordmark" width="120" height="25"
            src="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75" />
        </a>
        <div className="wx-navbar__links">
          <a href="https://webxter.in/courses">Courses</a>
          <a href="https://webxter.in/student-projects" className="wx-active">Projects</a>
          <a href="https://webxter.in/about">About</a>
          <a href="https://webxter.in/contact">Contact</a>
        </div>
        <div className="wx-navbar__actions">
          <a href="https://webxter.in/login" className="wx-btn wx-btn--ghost">Sign In</a>
          <a href="https://webxter.in/contact" className="wx-btn wx-btn--primary">Get Quote</a>
        </div>
      </div>
    </nav>
  );
}

function HeroBanner() {
  return (
    <section className="wx-hero">
      <div className="wx-container wx-hero__content">
        <div className="wx-hero__text">
          <h1 className="wx-hero__title">
            Student Projects &amp;<br />
            <span className="wx-gradient-text">College Project Guidance</span>
          </h1>
          <p className="wx-hero__subtitle">
            Get professional help with your final year projects, ready-made solutions,
            custom development, and affordable internship opportunities.
          </p>
          <div className="wx-hero__cta">
            <a href="#projects" className="wx-btn wx-btn--primary wx-btn--lg">Browse Projects</a>
            <a href="https://webxter.in/contact" className="wx-btn wx-btn--outline wx-btn--lg">Get Custom Project</a>
          </div>
        </div>
        <div className="wx-hero__stats">
          <div className="wx-stat">
            <span className="wx-stat__number">100+</span>
            <span className="wx-stat__label">Projects Delivered</span>
          </div>
          <div className="wx-stat">
            <span className="wx-stat__number">500+</span>
            <span className="wx-stat__label">Happy Students</span>
          </div>
          <div className="wx-stat">
            <span className="wx-stat__number">10+</span>
            <span className="wx-stat__label">Years Experience</span>
          </div>
          <div className="wx-stat">
            <span className="wx-stat__number">24/7</span>
            <span className="wx-stat__label">Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowWeHelp() {
  const cards = [
    { Icon: Icon.Package,   title: "Ready-Made Projects",  desc: "Complete, tested projects with full source code, documentation and video tutorials.", cta: "Browse Projects",    href: "#projects" },
    { Icon: Icon.Settings,  title: "Custom Development",   desc: "We build your project to your exact specifications with regular updates and deployment.", cta: "Get Custom Project", href: "https://webxter.in/contact" },
    { Icon: Icon.Target,    title: "Project Guidance",     desc: "Expert 1-on-1 mentoring, code reviews and problem-solving for your college project.", cta: "Get Guidance",       href: "https://webxter.in/contact" },
    { Icon: Icon.Briefcase, title: "Paid Internship",      desc: "Work on real industry projects with experienced mentors, earn a certificate and stipend.", cta: "Apply Now",          href: "https://webxter.in/careers" },
  ];
  return (
    <section className="wx-section wx-how">
      <div className="wx-container">
        <div className="wx-section__header">
          <h2 className="wx-section__title">How We Help Students</h2>
          <p className="wx-section__subtitle">From ready-made projects to custom development and internships — we've got you covered.</p>
        </div>
        <div className="wx-how__grid">
          {cards.map((c) => (
            <div key={c.title} className="wx-how__card">
              <div className="wx-how__icon"><c.Icon /></div>
              <h3 className="wx-how__card-title">{c.title}</h3>
              <p className="wx-how__card-desc">{c.desc}</p>
              <a href={c.href} className="wx-btn wx-btn--primary wx-btn--sm">{c.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, onAddToCart }) {
  const discount = Math.round(((project.originalPrice - project.price) / project.originalPrice) * 100);
  return (
    <div className={`wx-project-card ${project.soldOut ? "wx-project-card--sold-out" : ""}`}>
      {project.badge && <span className="wx-project-card__badge">{project.badge}</span>}
      {project.soldOut && <div className="wx-project-card__sold-out-overlay">Sold Out</div>}
      <div className="wx-project-card__header">
        <div className="wx-project-card__level" style={{ color: LEVEL_COLORS[project.level] }}>
          <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
          {project.level}
        </div>
        <div className="wx-project-card__delivery"><Icon.Clock /> {project.delivery}</div>
      </div>
      <h3 className="wx-project-card__title">{project.title}</h3>
      <p className="wx-project-card__desc">{project.description}</p>
      <div className="wx-project-card__tags">
        {project.tags.map((t) => <span key={t} className="wx-tag">{t}</span>)}
      </div>
      <ul className="wx-project-card__features">
        {project.features.map((f) => (
          <li key={f}><span className="wx-check"><Icon.Check /></span>{f}</li>
        ))}
      </ul>
      <div className="wx-project-card__pricing">
        <div className="wx-project-card__price">
          <span className="wx-price-current">₹{project.price.toLocaleString("en-IN")}</span>
          <span className="wx-price-original">₹{project.originalPrice.toLocaleString("en-IN")}</span>
          <span className="wx-price-discount">{discount}% OFF</span>
        </div>
      </div>
      <div className="wx-project-card__actions">
        <button className="wx-btn wx-btn--primary wx-btn--full" disabled={project.soldOut}
          onClick={() => !project.soldOut && onAddToCart(project)}>
          {project.soldOut ? "Sold Out" : "Add to Cart"}
        </button>
        <a href="https://webxter.in/contact" className="wx-btn wx-btn--ghost wx-btn--full">Know More</a>
      </div>
    </div>
  );
}

// ─── Pure-JS Swiper (no external lib) ────────────────────────────────────────
function useSwiper(itemCount) {
  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const dragDelta = useRef(0);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const goTo = useCallback((idx, total) => {
    setCurrent(clamp(idx, 0, total - 1));
  }, []);

  const onPointerDown = (e) => {
    isDragging.current = true;
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragDelta.current = 0;
    if (trackRef.current) trackRef.current.style.transition = "none";
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragDelta.current = x - startX.current;
  };

  const onPointerUp = (total) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.transition = "";
    if (dragDelta.current < -50) goTo(current + 1, total);
    else if (dragDelta.current > 50) goTo(current - 1, total);
    dragDelta.current = 0;
  };

  return { trackRef, current, goTo, onPointerDown, onPointerMove, onPointerUp };
}

// Category tabs — scrollable on mobile, normal on desktop
function CategoryTabs({ categories, active, onChange }) {
  const tabsRef = useRef(null);
  return (
    <div className="wx-filter-tabs-wrap">
      <div className="wx-filter-tabs" ref={tabsRef}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`wx-filter-tab ${active === cat ? "wx-filter-tab--active" : ""}`}
            onClick={() => onChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// Mobile card swiper
function MobileSwiper({ items, onAddToCart }) {
  const total = items.length;
  const { trackRef, current, goTo, onPointerDown, onPointerMove, onPointerUp } = useSwiper(total);

  if (total === 0) {
    return (
      <div className="wx-empty">
        <span>😕</span>
        <p>No projects found. Try a different category.</p>
      </div>
    );
  }

  return (
    <div className="wx-swiper">
      <div
        className="wx-swiper__viewport"
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={() => onPointerUp(total)}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={() => onPointerUp(total)}
        onMouseLeave={() => onPointerUp(total)}
      >
        <div
          ref={trackRef}
          className="wx-swiper__track"
          style={{ transform: `translateX(calc(-${current * 100}% - ${current * 16}px))` }}
        >
          {items.map((p) => (
            <div key={p.id} className="wx-swiper__slide">
              <ProjectCard project={p} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="wx-swiper__dots">
        {items.map((_, i) => (
          <button
            key={i}
            className={`wx-swiper__dot ${i === current ? "wx-swiper__dot--active" : ""}`}
            onClick={() => goTo(i, total)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        className="wx-swiper__arrow wx-swiper__arrow--prev"
        onClick={() => goTo(current - 1, total)}
        disabled={current === 0}
        aria-label="Previous"
      >‹</button>
      <button
        className="wx-swiper__arrow wx-swiper__arrow--next"
        onClick={() => goTo(current + 1, total)}
        disabled={current === total - 1}
        aria-label="Next"
      >›</button>
    </div>
  );
}

function ProjectsSection({ onAddToCart }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const filtered = PROJECTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section id="projects" className="wx-section wx-projects">
      <div className="wx-container">
        <div className="wx-section__header">
          <h2 className="wx-section__title">Featured Ready-Made Projects</h2>
          <p className="wx-section__subtitle">
            Professional projects with complete source code, documentation, and support.
          </p>
        </div>

        <div className="wx-projects__controls">
          <div className="wx-search">
            <span className="wx-search__icon"><Icon.Search /></span>
            <input
              type="text"
              placeholder="Search projects, technologies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="wx-search__input"
            />
          </div>
          {/* Category tabs — swipeable on mobile */}
          <CategoryTabs
            categories={CATEGORIES}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Mobile → swiper | Desktop → grid */}
        {isMobile ? (
          <MobileSwiper items={filtered} onAddToCart={onAddToCart} />
        ) : (
          filtered.length === 0 ? (
            <div className="wx-empty">
              <span>😕</span>
              <p>No projects found. Try a different search or category.</p>
            </div>
          ) : (
            <div className="wx-projects__grid">
              {filtered.map((p) => (
                <ProjectCard key={p.id} project={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}

function WhyChoose() {
  const reasons = [
    { Ic: Icon.Zap,    title: "Save Time",      desc: "Quick turnaround without compromising on quality." },
    { Ic: Icon.Award,  title: "High Quality",   desc: "Professional-grade projects that impress your professors." },
    { Ic: Icon.Shield, title: "100% Original",  desc: "Unique projects with no plagiarism concerns." },
    { Ic: Icon.Users,  title: "Expert Support", desc: "Help from experienced developers and mentors." },
  ];
  return (
    <section className="wx-section wx-why">
      <div className="wx-container">
        <div className="wx-section__header">
          <h2 className="wx-section__title">Why Choose Webxter for Your Projects?</h2>
        </div>
        <div className="wx-why__grid">
          {reasons.map((r) => (
            <div key={r.title} className="wx-why__card">
              <div className="wx-why__icon"><r.Ic /></div>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }) {
  return (
    <div className="wx-testimonial-card">
      <div className="wx-testimonial-card__stars">
        {Array.from({ length: t.rating }).map((_, i) => <Icon.Star key={i} />)}
      </div>
      <p className="wx-testimonial-card__text">"{t.text}"</p>
      <div className="wx-testimonial-card__author">
        <div className="wx-avatar">{t.avatar}</div>
        <div>
          <div className="wx-testimonial-card__name">{t.name}</div>
          <div className="wx-testimonial-card__college">{t.college}</div>
          <div className="wx-testimonial-card__project">Project: {t.project}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialSwiper() {
  const total = TESTIMONIALS.length;
  const { trackRef, current, goTo, onPointerDown, onPointerMove, onPointerUp } = useSwiper(total);
  return (
    <div className="wx-swiper">
      <div
        className="wx-swiper__viewport"
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={() => onPointerUp(total)}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={() => onPointerUp(total)}
        onMouseLeave={() => onPointerUp(total)}
      >
        <div
          ref={trackRef}
          className="wx-swiper__track"
          style={{ transform: `translateX(calc(-${current * 100}% - ${current * 16}px))` }}
        >
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="wx-swiper__slide">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>
      <div className="wx-swiper__dots">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} className={`wx-swiper__dot ${i === current ? "wx-swiper__dot--active" : ""}`}
            onClick={() => goTo(i, total)} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
      <button className="wx-swiper__arrow wx-swiper__arrow--prev" onClick={() => goTo(current - 1, total)} disabled={current === 0} aria-label="Previous">‹</button>
      <button className="wx-swiper__arrow wx-swiper__arrow--next" onClick={() => goTo(current + 1, total)} disabled={current === total - 1} aria-label="Next">›</button>
    </div>
  );
}

function Testimonials() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="wx-section wx-testimonials">
      <div className="wx-container">
        <div className="wx-section__header">
          <h2 className="wx-section__title">What Students Say</h2>
          <p className="wx-section__subtitle">Success stories from students across India.</p>
        </div>
        {isMobile ? (
          <TestimonialSwiper />
        ) : (
          <div className="wx-testimonials__grid">
            {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} t={t} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="wx-cta-banner">
      <div className="wx-container wx-cta-banner__inner">
        <div className="wx-cta-banner__badge">
          <Icon.GraduationCap /> Student Special Offer
        </div>
        <h2 className="wx-cta-banner__title">Ready to Get Started?</h2>
        <p className="wx-cta-banner__subtitle">
          Don't wait until the last minute. Get your project done professionally and on time.
          Show your student ID and get flat <strong>20% OFF</strong> on all projects &amp; courses.
        </p>
        <div className="wx-cta-banner__actions">
          <a href="https://webxter.in/contact" className="wx-btn wx-btn--primary wx-btn--lg">Get Enrolled Now</a>
          <a href="https://webxter.in/contact" className="wx-btn wx-btn--outline wx-btn--lg">Call for Consultation</a>
        </div>
        <p className="wx-cta-banner__contact">
          <Icon.WhatsApp /> +91-8264796534 &nbsp;&nbsp;
          <Icon.Mail /> projects@webxter.in
        </p>
      </div>
    </section>
  );
}

function CartDrawer({ cart, onRemove, onClose }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return (
    <div className="wx-cart-overlay" onClick={onClose}>
      <div className="wx-cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="wx-cart-drawer__header">
          <h3><Icon.Cart /> Your Cart ({cart.length})</h3>
          <button className="wx-cart-drawer__close" onClick={onClose}>✕</button>
        </div>
        {cart.length === 0 ? (
          <div className="wx-cart-drawer__empty">
            <Icon.Cart />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="wx-cart-drawer__items">
              {cart.map((item, idx) => (
                <div key={idx} className="wx-cart-item">
                  <div className="wx-cart-item__info">
                    <div className="wx-cart-item__title">{item.title}</div>
                    <div className="wx-cart-item__tags">
                      {item.tags.map((t) => <span key={t} className="wx-tag wx-tag--sm">{t}</span>)}
                    </div>
                  </div>
                  <div className="wx-cart-item__right">
                    <span className="wx-cart-item__price">₹{item.price.toLocaleString("en-IN")}</span>
                    <button className="wx-cart-item__remove" onClick={() => onRemove(idx)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="wx-cart-drawer__footer">
              <div className="wx-cart-drawer__total">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <button className="wx-btn wx-btn--primary wx-btn--full wx-btn--lg">Proceed to Checkout</button>
              <p className="wx-cart-drawer__note">
                <Icon.GraduationCap /> Student ID? Get 20% off at checkout!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="wx-footer">
      <div className="wx-container wx-footer__grid">
        <div className="wx-footer__brand">
          <img alt="Webxter" width="120" height="25"
            src="https://www.webxter.in/_next/image?url=%2Fwebxter-text-light.png&w=256&q=75"
            style={{ filter: "brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(500%) hue-rotate(170deg)" }} />
          <p>Empowering individuals through quality education and innovative learning experiences since 2010.</p>
          <div className="wx-footer__contact">
            <span><Icon.Mail /> info@webxter.in</span>
            <span><Icon.Phone /> +91 (826) 479-6534</span>
          </div>
        </div>
        <div className="wx-footer__links">
          <h4>Quick Links</h4>
          <a href="https://webxter.in/about">About Us</a>
          <a href="https://webxter.in/courses">Courses</a>
          <a href="https://student.webxter.in/">Student Portal</a>
          <a href="https://webxter.in/contact">Contact</a>
          <a href="https://webxter.in/blogs">Blogs</a>
        </div>
        <div className="wx-footer__links">
          <h4>Resources</h4>
          <a href="https://webxter.in/terms-of-service">Terms of Service</a>
          <a href="https://webxter.in/privacy-policy">Privacy Policy</a>
          <a href="https://webxter.in/verify-certificate">Verify Certificate</a>
          <a href="https://webxter.in/careers">Careers</a>
        </div>
        <div className="wx-footer__newsletter">
          <h4>Newsletter</h4>
          <p>Stay updated with the latest projects, courses, and offers.</p>
          <div className="wx-newsletter-form">
            <input type="email" placeholder="Your email address" />
            <button className="wx-btn wx-btn--primary">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="wx-footer__bottom">
        <p>© 2026 Webxter. All rights reserved. ISO 9001:2015 Certified</p>
        <div className="wx-footer__bottom-links">
          <a href="https://webxter.in/terms-of-service">Terms</a>
          <a href="https://webxter.in/privacy-policy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentProjects() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const addToCart = (project) => {
    setCart((prev) => [...prev, project]);
    setToast(`"${project.title}" added to cart!`);
    setTimeout(() => setToast(null), 3000);
  };

  const removeFromCart = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="wx-page">
      <MarqueeBanner />
      <Navbar />

      <button className="wx-cart-fab" onClick={() => setCartOpen(true)}>
        <Icon.Cart />
        {cart.length > 0 && <span className="wx-cart-fab__count">{cart.length}</span>}
      </button>

      {toast && <div className="wx-toast">{toast}</div>}

      {cartOpen && (
        <CartDrawer cart={cart} onRemove={removeFromCart} onClose={() => setCartOpen(false)} />
      )}

      <HeroBanner />
      <HowWeHelp />
      <ProjectsSection onAddToCart={addToCart} />
      <WhyChoose />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  );
}
