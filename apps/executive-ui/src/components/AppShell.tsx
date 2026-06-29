import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/situations", label: "Situations" },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <Link href="/" className="brand-link">
            ApexOS
          </Link>
          <span className="brand-tag">Executive</span>
        </div>
        <nav className="header-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {title && (
          <div className="page-header">
            <h1>{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
      <footer className="app-footer">
        <span>Build 10 — Executive Interface</span>
        <span className="footer-note">Runtime boundaries preserved · No inference in UI</span>
      </footer>
    </div>
  );
}
