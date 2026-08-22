import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DotGrid } from "../DotGrid/DotGrid";
import styles from "./Hero.module.css";

const RINGS = [0.28, 0.44, 0.6, 0.76, 0.92];

export function Hero() {
  return (
    <section className={styles.hero}>
      <DotGrid />
      <svg className={styles.rings} viewBox="0 0 100 100" aria-hidden="true">
        <g className={styles.ringsGroup}>
          {RINGS.map((r, index) => (
            <motion.circle
              key={r}
              cx="82"
              cy="18"
              r={r * 60}
              fill="none"
              stroke="var(--color-ring)"
              strokeWidth="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.5 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: index * 0.12, ease: "easeOut" }}
            />
          ))}
        </g>
      </svg>
      <div className={styles.content}>
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Reportes de ubicación · Colombia
        </motion.p>
        <motion.h1
          className={styles.headline}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          La investigación de zona que ya no tienes que hacer tú.
        </motion.h1>
        <motion.p
          className={styles.subheadline}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: "easeOut" }}
        >
          VecinData convierte cualquier dirección en un reporte verificado del
          entorno — colegios, transporte, comercio y más — en segundos. Más
          información para tu cliente, cero horas buscándola, y todo
          respaldado con datos reales, no promesas.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34, ease: "easeOut" }}
        >
          <Link to="/generar" className={styles.ctaButton}>
            Generar un reporte
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
