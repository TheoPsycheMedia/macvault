import Link from "next/link";

const footerLinks = [
  { href: "/browse", label: "Browse Tools" },
  { href: "/categories", label: "Categories" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/about", label: "About MacVault" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/8 bg-black/30">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight text-white">
            MacVault
          </p>
          <p className="mt-3 max-w-md text-sm text-white/60">
            Curated open-source Mac tools, evaluated with a transparent scoring model and
            real-world install guidance.
          </p>
        </div>

        <div className="grid gap-3 text-sm">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/70 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <p className="pt-2 text-xs text-white/45">© {new Date().getFullYear()} MacVault</p>
        </div>
      </div>
    </footer>
  );
}
