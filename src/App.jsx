import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Inicio from "./pages/Inicio";
import ListasPersonas from "./pages/ListasPersonas";
import "./App.css";

function App() {
  return (
    <div className="aplicacion">
      <Navbar />

      <main className="contenido-app">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route
            path="/personas/:listaId"
            element={<ListasPersonas />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;