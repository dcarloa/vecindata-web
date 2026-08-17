import { Hero } from "../components/Hero/Hero";
import styles from "./LandingPage.module.css";

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

export function LandingPage() {
  return (
    <main>
      <Hero />
      <section className={styles.steps} aria-labelledby="how-it-works">
        <h2 id="how-it-works" className={styles.stepsTitle}>
          Cómo funciona
        </h2>
        <ol className={styles.stepsList}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer className={styles.footer}>
        <p>
          VecinData — hecho para inmobiliarias en Colombia. Datos de
          OpenStreetMap y otras fuentes abiertas.
        </p>
      </footer>
    </main>
  );
}
