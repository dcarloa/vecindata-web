import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <motion.h1
        className={styles.headline}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        El contexto de la zona, listo en segundos.
      </motion.h1>
      <motion.p
        className={styles.subheadline}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      >
        VecinData convierte cualquier dirección en un reporte de ubicación
        profesional — mapa, qué hay alrededor, accesibilidad y un resumen que
        no inventa nada. Ideal para adjuntar a tus anuncios inmobiliarios.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <Link to="/generar" className={styles.ctaButton}>
          Generar un reporte
        </Link>
      </motion.div>
    </section>
  );
}
