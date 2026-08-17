import { Routes, Route, Navigate } from "react-router-dom";
import { NavBar } from "./components/NavBar/NavBar";
import { LandingPage } from "./pages/LandingPage";
import { OperatorPage } from "./pages/OperatorPage";
import { AccessGate } from "./components/AccessGate/AccessGate";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/generar"
          element={
            <AccessGate>
              {(accessKey, onAccessDenied) => (
                <OperatorPage accessKey={accessKey} onAccessDenied={onAccessDenied} />
              )}
            </AccessGate>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
