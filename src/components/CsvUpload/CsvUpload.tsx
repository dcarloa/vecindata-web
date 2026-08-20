import { ChangeEvent, useState } from "react";
import { parseAddressCsv } from "../../utils/csv";
import styles from "./CsvUpload.module.css";

interface CsvUploadProps {
  onParsed: (addresses: string[]) => void;
}

export function CsvUpload({ onParsed }: CsvUploadProps) {
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseAddressCsv(text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onParsed(result.addresses);
    };
    reader.onerror = () => setError("No se pudo leer el archivo.");
    reader.readAsText(file);
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>
        <span>Sube un CSV con una dirección por fila</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className={styles.input}
        />
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
