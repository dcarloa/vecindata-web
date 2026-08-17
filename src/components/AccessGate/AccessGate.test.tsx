import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccessGate } from "./AccessGate";

const STORAGE_KEY = "vecindata_operator_key";

describe("AccessGate", () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("shows the access form when no key is stored", () => {
    render(<AccessGate>{() => <p>Contenido protegido</p>}</AccessGate>);
    expect(
      screen.getByRole("heading", { name: /acceso al panel operador/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("stores the key and shows the protected content after submitting", async () => {
    const user = userEvent.setup();
    render(<AccessGate>{(accessKey) => <p>Clave: {accessKey}</p>}</AccessGate>);

    await user.type(screen.getByPlaceholderText(/clave de acceso/i), "secreta123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(screen.getByText("Clave: secreta123")).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("secreta123");
  });

  it("shows the protected content directly when a key is already stored", () => {
    localStorage.setItem(STORAGE_KEY, "ya-guardada");
    render(<AccessGate>{(accessKey) => <p>Clave: {accessKey}</p>}</AccessGate>);
    expect(screen.getByText("Clave: ya-guardada")).toBeInTheDocument();
  });

  it("clears the stored key and shows the form again when onAccessDenied is called", async () => {
    localStorage.setItem(STORAGE_KEY, "vieja");
    const user = userEvent.setup();
    render(
      <AccessGate>
        {(accessKey, onAccessDenied) => (
          <button onClick={onAccessDenied}>Simular 401 ({accessKey})</button>
        )}
      </AccessGate>
    );

    await user.click(screen.getByRole("button", { name: /simular 401/i }));

    expect(
      screen.getByRole("heading", { name: /acceso al panel operador/i })
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
