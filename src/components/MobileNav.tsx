import { Link, useLocation } from "@tanstack/react-router";
import { Home, BookOpen, MessageCircle, User, Clapperboard, Users } from "lucide-react";
const items = [
  { to: "/perfil", icon: User, label: "Perfil" },
  { to: "/", icon: Home, label: "Início" },
  { to: "/conversar", icon: MessageCircle, label: "Conversar" },
  { to: "/curso", icon: BookOpen, label: "Curso" },
  { to: "/series", icon: Clapperboard, label: "Séries" },
  { to: "/social", icon: Users, label: "Social" },
] as const;

export function MobileNav() {
  const location = useLocation();
  const pathname = location.pathname;
  return (
    <nav className="mobile-nav" aria-label="Navegação principal">
      <div className="mobile-nav__inner">
        {items.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`mobile-nav__item ${active ? "mobile-nav__item--active" : ""}`}
            >
              <Icon className="mobile-nav__icon" strokeWidth={active ? 2.5 : 2} />
              <span className="mobile-nav__label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
