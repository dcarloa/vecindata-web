import { motion } from "framer-motion";
import { Hero } from "../components/Hero/Hero";
import { SectionHeading } from "../components/SectionHeading/SectionHeading";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider/BeforeAfterSlider";
import { Logo } from "../components/Logo/Logo";
import styles from "./LandingPage.module.css";

const INCLUDES = [
  {
    number: "01",
    title: "Puntos de interés cercanos",
    description:
      "Colegios, salud, transporte, comercio, restaurantes, parques y bancos — lo que de verdad rodea el inmueble.",
  },
  {
    number: "02",
    title: "Isócronas a pie",
    description:
      "Qué tan lejos queda todo caminando, no en línea recta. Así se mueve la gente en realidad.",
  },
  {
    number: "03",
    title: "Mapa y vista satelital",
    description:
      "Contexto visual inmediato de la zona, sin que el cliente tenga que abrir otra pestaña.",
  },
  {
    number: "04",
    title: "Resumen escrito y tu marca",
    description:
      "Un resumen que no inventa nada, con tu logo y tus colores listo para adjuntar al anuncio.",
  },
];

const STEPS = [
  {
    title: "Ingresa la dirección del inmueble",
    description:
      "Solo necesitas la dirección — nosotros nos encargamos del resto.",
  },
  {
    title: "Recolectamos datos reales del entorno",
    description:
      "Colegios, salud, transporte, comercio, restaurantes, parques y bancos cercanos.",
  },
  {
    title: "Descarga un PDF listo para compartir",
    description:
      "Con tu logo y colores, para adjuntar directo a tu anuncio.",
  },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.55, delay, ease: "easeOut" as const },
  };
}

function BareListingMock() {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockImage} />
      <p className={styles.mockPrice}>$420.000.000</p>
      <p className={styles.mockAddress}>Calle 71 # 91-72, Bogotá</p>
      <p className={styles.mockMeta}>3 hab · 2 baños · 84 m²</p>
    </div>
  );
}

function EnrichedListingMock() {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockImage}>
        <div className={styles.mockMapOverlay} />
      </div>
      <p className={styles.mockPrice}>$420.000.000</p>
      <p className={styles.mockAddress}>Calle 71 # 91-72, Bogotá</p>
      <p className={styles.mockMeta}>3 hab · 2 baños · 84 m²</p>
      <div className={styles.mockBadgeRow}>
        <span className={styles.mockBadge}>3 colegios · 10 min</span>
        <span className={styles.mockBadge}>Transporte · 5 min</span>
        <span className={styles.mockBadge}>Parque · 4 min</span>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main>
      <Hero />

      <section className={styles.section} aria-labelledby="includes-heading">
        <SectionHeading
          number="Qué incluye"
          title="Todo lo que un comprador pregunta, ya resuelto"
        />
        <div className={styles.includesGrid}>
          {INCLUDES.map((item, index) => (
            <motion.div
              key={item.title}
              className={styles.includeCard}
              {...fadeUp(index * 0.08)}
            >
              <span className={styles.includeNumber}>{item.number}</span>
              <h3 className={styles.includeTitle}>{item.title}</h3>
              <p className={styles.includeDescription}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="compare-heading">
        <SectionHeading
          number="Antes y después"
          title="El mismo anuncio, con contexto real"
          description="Arrastra para comparar."
        />
        <BeforeAfterSlider
          before={<BareListingMock />}
          after={<EnrichedListingMock />}
          beforeLabel="Sin VecinData"
          afterLabel="Con VecinData"
        />
      </section>

      <section className={styles.steps} aria-labelledby="how-it-works">
        <SectionHeading number="Cómo funciona" title="Tres pasos, un PDF" />
        <ol className={styles.stepsList}>
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              className={styles.step}
              {...fadeUp(index * 0.1)}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <motion.section className={styles.manifesto} {...fadeUp()}>
        <p className={styles.manifestoText}>
          No inventamos plusvalía ni adornamos el entorno. Cada dato viene de
          fuentes abiertas — OpenStreetMap, isócronas reales, mapas
          verificables — para que tu anuncio diga la verdad y aun así se vea
          bien.
        </p>
      </motion.section>

      <footer className={styles.footer}>
        <Logo variant="light" />
        <p className={styles.footerText}>
          Hecho para inmobiliarias en Colombia. Datos de OpenStreetMap y otras
          fuentes abiertas.
        </p>
      </footer>
    </main>
  );
}
