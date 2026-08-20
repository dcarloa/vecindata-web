import { ChangeEvent, DragEvent, useState } from "react";
import { parseAddressCsv } from "../../utils/csv";
import styles from "./CsvUpload.module.css";

interface CsvUploadProps {
  onParsed: (addresses: string[]) => void;
}

export function CsvUpload({ onParsed }: CsvUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function processFile(file: File) {
    setFileName(file.name);
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    processFile(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  }

  return (
    <div className={styles.wrapper}>
      <label
        className={isDragging ? `${styles.dropzone} ${styles.dragging}` : styles.dropzone}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 15.5V4M12 4l-4 4M12 4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.label}>Sube un CSV con una dirección por fila</span>
        <span className={styles.hint}>Arrastra el archivo aquí o haz clic para elegirlo</span>
        <span className={styles.fileName}>{fileName ?? "Sin archivo seleccionado"}</span>
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
