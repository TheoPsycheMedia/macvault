import Link from "next/link";

const footerColumns = [
  {
    title: "Explore",
    links: [
      { href: "/browse", label: "Browse Tools" },
      { href: "/categories", label: "Categories" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { href: "/newsletter", label: "Newsletter" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Collection",
    links: [{ href: "/", label: "Featured" }],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[color:var(--border)] bg-[color:var(--bg-soft)]">
      <div className="editorial-shell grid gap-12 py-14 md:grid-cols-[1.1fr_1.9fr]">
        <div>
          <p className="text-xl font-medium tracking-[-0.01em] text-[color:var(--text)]">MacVault</p>
          <p className="mt-4 max-w-sm text-sm text-[color:var(--text-muted)]">
            A premium index of open-source Mac tools, reviewed with transparent scoring and
            practical install guidance.
          </p>
          <p className="mt-7 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
            Copyright {new Date().getFullYear()} MacVault
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                {column.title}
              </p>
              <div className="mt-4 grid gap-2.5 text-sm">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[color:var(--text-muted)] transition-colors duration-300 hover:text-[color:var(--text)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
