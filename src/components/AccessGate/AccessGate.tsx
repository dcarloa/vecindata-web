import { FormEvent, ReactNode, useState } from "react";
import styles from "./AccessGate.module.css";

const STORAGE_KEY = "vecindata_operator_key";

interface AccessGateProps {
  children: (accessKey: string, onAccessDenied: () => void) => ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const [accessKey, setAccessKey] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [inputValue, setInputValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length === 0) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, trimmed);
    setAccessKey(trimmed);
  }

  function handleAccessDenied() {
    localStorage.removeItem(STORAGE_KEY);
    setAccessKey(null);
  }

  if (accessKey === null) {
    return (
      <main className={styles.page}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Acceso al panel operador</h1>
          <p className={styles.intro}>Ingresa la clave de acceso para continuar.</p>
          <input
            type="password"
            className={styles.input}
            placeholder="Clave de acceso"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
          <button type="submit" className={styles.submit}>
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return <>{children(accessKey, handleAccessDenied)}</>;
}
