import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar/NavBar";
import { LandingPage } from "./pages/LandingPage";
import { OperatorPage } from "./pages/OperatorPage";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/generar" element={<OperatorPage />} />
      </Routes>
    </>
  );
}

export default App;
