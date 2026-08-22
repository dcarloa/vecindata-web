import { motion, useScroll, useTransform } from "framer-motion";
import { Fragment, useRef } from "react";
import { Hero } from "../components/Hero/Hero";
import { SectionHeading } from "../components/SectionHeading/SectionHeading";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider/BeforeAfterSlider";
import { Logo } from "../components/Logo/Logo";
import comparadorSatellite from "../assets/comparador-satellite.jpg";
import styles from "./LandingPage.module.css";

// Same thin line-icon aesthetic (24x24 viewBox, stroke 1.5, round caps) used
// for POI categories in the generated PDF and the category chips in
// PersonalizationFields, so the marketing site and the product read as one
// system.
const INCLUDE_ICON_PATHS: Record<string, React.ReactNode> = {
  pin: (
    <>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  layers: (
    <>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </>
  ),
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </>
  ),
};

function IncludeIcon({ icon }: { icon: string }) {
  return (
    <svg
      className={styles.includeIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {INCLUDE_ICON_PATHS[icon]}
    </svg>
  );
}

const INCLUDES = [
  {
    number: "01",
    icon: "pin",
    title: "Puntos de interés cercanos",
    description:
      "Colegios, salud, transporte, comercio, restaurantes, parques y bancos — lo que de verdad rodea el inmueble.",
  },
  {
    number: "02",
    icon: "clock",
    title: "Isócronas a pie",
    description:
      "Qué tan lejos queda todo caminando, no en línea recta. Así se mueve la gente en realidad.",
  },
  {
    number: "03",
    icon: "layers",
    title: "Mapa y vista satelital",
    description:
      "Contexto visual inmediato de la zona, sin que el cliente tenga que abrir otra pestaña.",
  },
  {
    number: "04",
    icon: "document",
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

const FAQ = [
  {
    question: "¿De dónde salen los datos?",
    answer:
      "OpenStreetMap, isócronas caminando reales (no línea recta) y mapas verificables. No inventamos ni adornamos nada del entorno.",
  },
  {
    question: "¿El resumen escrito puede inventar cosas?",
    answer:
      "No debería: cada resumen se verifica contra los datos recolectados antes de mostrarse. Si algo no se puede confirmar contra esos datos, mostramos un aviso en vez de un resumen inventado.",
  },
  {
    question: "¿Funciona en toda Colombia o solo en Bogotá?",
    answer:
      "El buscador de direcciones está habilitado para toda Colombia. Lo hemos validado más a fondo en Bogotá hasta ahora, y seguimos ajustándolo con el uso real en otras ciudades.",
  },
  {
    question: "¿Puedo generar varios reportes a la vez?",
    answer:
      "Sí — puedes subir un CSV con varias direcciones y generar todos los reportes en un solo lote, cada uno con tu logo y marca.",
  },
  {
    question: "¿Cómo consigo acceso?",
    answer:
      "Hoy activamos el acceso directamente contigo, sin planes ni tarjetas de crédito de por medio. Escríbenos y te compartimos una clave para empezar.",
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
      <div className={styles.mockImage}>
        <svg
          className={styles.mockImagePlaceholder}
          viewBox="0 0 320 200"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Deliberately plain — a generic listing photo sketch, not a
              polished illustration, so the "after" panel's real report
              reads as the richer, more finished side of the comparison. */}
          <line x1="0" y1="150" x2="320" y2="150" />
          <rect x="60" y="80" width="120" height="70" />
          <path d="M52 80L120 40l68 40" />
          <rect x="100" y="110" width="24" height="40" />
          <rect x="140" y="95" width="20" height="20" />
          <rect x="200" y="100" width="70" height="50" />
          <line x1="200" y1="115" x2="270" y2="115" />
          <line x1="225" y1="100" x2="225" y2="150" />
        </svg>
      </div>
      <p className={styles.mockPrice}>$420.000.000</p>
      <p className={styles.mockAddress}>Calle 71 # 91-72, Bogotá</p>
      <p className={styles.mockMeta}>3 hab · 2 baños · 84 m²</p>
    </div>
  );
}

const REPORT_BADGES = [
  "Puntaje 8.2/10",
  "3 colegios cerca",
  "Buena conectividad",
  "Resumen verificado",
];

function EnrichedListingMock() {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockImage}>
        <img
          src={comparadorSatellite}
          alt="Vista satelital real del entorno del inmueble, generada por VecinData"
          className={styles.mockSatelliteImage}
        />
        <svg
          className={styles.mockPin}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" fill="var(--color-surface)" />
        </svg>
      </div>
      <p className={styles.mockPrice}>$420.000.000</p>
      <p className={styles.mockAddress}>Calle 71 # 91-72, Bogotá</p>
      <p className={styles.mockMeta}>3 hab · 2 baños · 84 m²</p>
      <div className={styles.mockBadgeRow}>
        {REPORT_BADGES.map((badge) => (
          <span key={badge} className={styles.mockBadge}>
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const pageRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: pageRef });
  const background = useTransform(
    scrollYProgress,
    [0, 0.35, 0.7, 1],
    ["#f6f1e6", "#f2ead6", "#f6f1e6", "#eee3c8"]
  );
  const blobY = useTransform(scrollYProgress, [0, 1], ["-15%", "70%"]);
  const blobRotate = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <motion.main ref={pageRef} style={{ background }} className={styles.page}>
      <Hero />

      <motion.div
        className={styles.ambientBlob}
        style={{ y: blobY, rotate: blobRotate }}
        aria-hidden="true"
      />

      <section
        id="incluye"
        className={styles.section}
        aria-labelledby="includes-heading"
      >
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
              <IncludeIcon icon={item.icon} />
              <span className={styles.includeNumber}>{item.number}</span>
              <h3 className={styles.includeTitle}>{item.title}</h3>
              <p className={styles.includeDescription}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="comparar"
        className={styles.section}
        aria-labelledby="compare-heading"
      >
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

      <section
        id="como-funciona"
        className={styles.steps}
        aria-labelledby="how-it-works"
      >
        <SectionHeading number="Cómo funciona" title="Tres pasos, un PDF" />
        <ol className={styles.stepsList}>
          {STEPS.map((step, index) => (
            <Fragment key={step.title}>
              <motion.li className={styles.step} {...fadeUp(index * 0.1)}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </motion.li>
              {index < STEPS.length - 1 && (
                <li className={styles.stepArrow} aria-hidden="true">
                  →
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </section>

      <section
        id="preguntas-frecuentes"
        className={styles.section}
        aria-labelledby="faq-heading"
      >
        <SectionHeading number="Dudas comunes" title="Preguntas frecuentes" />
        <motion.div className={styles.faqList} {...fadeUp()}>
          {FAQ.map((item) => (
            <details key={item.question} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.question}</summary>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </details>
          ))}
        </motion.div>
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
    </motion.main>
  );
}
