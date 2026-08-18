import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "../Logo/Logo";
import styles from "./NavBar.module.css";

const SECTIONS = [
  { id: "incluye", label: "Qué incluye" },
  { id: "comparar", label: "Antes / después" },
  { id: "como-funciona", label: "Cómo funciona" },
];

export function NavBar() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const highlightedId = hoveredId ?? activeId;

  useEffect(() => {
    if (!isLanding) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const mostVisible = visible.reduce((a, b) =>
          a.intersectionRatio > b.intersectionRatio ? a : b
        );
        setActiveId(mostVisible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isLanding]);

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand} aria-label="VecinData">
          <Logo />
        </Link>
        {isLanding && (
          <ul className={styles.menu} onMouseLeave={() => setHoveredId(null)}>
            {SECTIONS.map((section) => (
              <li
                key={section.id}
                className={styles.menuItem}
                onMouseEnter={() => setHoveredId(section.id)}
              >
                {highlightedId === section.id && (
                  <motion.span
                    layoutId="nav-indicator"
                    className={styles.indicator}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <a href={`#${section.id}`} className={styles.menuLink}>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <Link to="/generar" className={styles.cta}>
          Generar reporte
        </Link>
      </nav>
    </header>
  );
}
