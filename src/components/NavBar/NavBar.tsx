import { Link } from "react-router-dom";
import { Logo } from "../Logo/Logo";
import styles from "./NavBar.module.css";

export function NavBar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand} aria-label="VecinData">
          <Logo />
        </Link>
        <Link to="/generar" className={styles.cta}>
          Generar reporte
        </Link>
      </nav>
    </header>
  );
}
