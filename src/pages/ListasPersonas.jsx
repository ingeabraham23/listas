import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  FaArrowLeft,
  FaCamera,
  FaPlus,
  FaEllipsisV,
  FaCheck,
  FaTimes,
  FaTrash,
  FaPen,
  FaSort,
} from "react-icons/fa";
import { db } from "../db/database";
import "./ListasPersonas.css";

function ListasPersonas() {
  const { listaId } = useParams();
  const id = Number(listaId);
  const navigate = useNavigate();
  const tablaRef = useRef(null);

  const [lista, setLista] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [editando, setEditando] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [orden, setOrden] = useState("nombre");

  const [aporteCompleto, setAporteCompleto] = useState("100");

  const [colorCero, setColorCero] = useState("#FCE7E7");
  const [colorBajo, setColorBajo] = useState("#FEF3C7");
  const [colorParcial, setColorParcial] = useState("#DBEAFE");
  const [colorCompleto, setColorCompleto] = useState("#D1FAE5");

  const [mostrarConfig, setMostrarConfig] = useState(false);

  async function cargarDatos() {
    const encontrada = await db.listas.get(id);

    if (!encontrada) {
      navigate("/", { replace: true });
      return;
    }

    setLista(encontrada);

    const configuracion = encontrada.configuracion || {};

    setAporteCompleto(String(configuracion.aporteCompleto ?? 100));

    setColorCero(configuracion.colorCero || "#FCE7E7");
    setColorBajo(configuracion.colorBajo || "#FEF3C7");
    setColorParcial(configuracion.colorParcial || "#DBEAFE");
    setColorCompleto(configuracion.colorCompleto || "#D1FAE5");

    // Cargar las personas registradas en esta lista
    const registros = await db.personas.where("listaId").equals(id).toArray();

    setPersonas(registros);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function guardarConfiguracion() {
    const completo = Number(aporteCompleto);

    if (
      aporteCompleto.trim() === "" ||
      !Number.isFinite(completo) ||
      completo <= 0
    ) {
      alert("El aporte completo debe ser mayor que cero.");
      return;
    }

    await db.listas.update(id, {
      configuracion: {
        aporteCompleto: completo,
        colorCero,
        colorBajo,
        colorParcial,
        colorCompleto,
      },
      fechaActualizacion: new Date().toISOString(),
    });

    setMostrarConfig(false);
    await cargarDatos();
  }

  async function guardarPersona(e) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    const importe = Number(cantidad);

    if (
      !nombreLimpio ||
      cantidad === "" ||
      !Number.isFinite(importe) ||
      importe < 0
    ) {
      alert("Escribe un nombre y una cantidad válida.");
      return;
    }

    if (editando !== null) {
      await db.personas.update(editando, {
        nombre: nombreLimpio,
        cantidad: importe,
      });
    } else {
      await db.personas.add({
        listaId: id,
        nombre: nombreLimpio,
        cantidad: importe,
      });
    }

    await db.listas.update(id, {
      fechaActualizacion: new Date().toISOString(),
    });

    cancelarEdicion();
    await cargarDatos();
  }

  function iniciarEdicion(persona) {
    setEditando(persona.id);
    setNombre(persona.nombre);
    setCantidad(String(persona.cantidad));
    setMenuAbierto(null);
  }

  function cancelarEdicion() {
    setEditando(null);
    setNombre("");
    setCantidad("");
  }

  async function eliminarPersona(persona) {
    setMenuAbierto(null);

    if (!window.confirm(`¿Eliminar a ${persona.nombre}?`)) return;

    await db.personas.delete(persona.id);
    await cargarDatos();
  }

  async function capturarTabla() {
    if (!tablaRef.current) return;

    const canvas = await html2canvas(tablaRef.current, {
      scale: 6,
      backgroundColor: "#ffffff",
      useCORS: true,
      onclone: (documento) => {
        documento.querySelectorAll(".no-captura").forEach((elemento) => {
          elemento.style.display = "none";
        });
      },
    });

    const enlace = document.createElement("a");
    enlace.download = `${lista?.nombre || "lista"}.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  }

  const compararNombres = (a, b) =>
    a.nombre.localeCompare(b.nombre, "es", {
      numeric: true,
      sensitivity: "base",
    });

  const personasOrdenadas = [...personas].sort((a, b) => {
    if (orden === "cantidad") {
      return b.cantidad - a.cantidad || compararNombres(a, b);
    }

    if (orden === "cantidadAsc") {
      return a.cantidad - b.cantidad || compararNombres(a, b);
    }

    return compararNombres(a, b);
  });

  function colorFila(importe) {
    const completo = Number(aporteCompleto);

    if (importe === 0) return colorCero;
    if (importe < completo / 2) return colorBajo;
    if (importe < completo) return colorParcial;

    return colorCompleto;
  }

  const total = personas.reduce((suma, persona) => suma + persona.cantidad, 0);
  const sinAporte = personas.filter((persona) => persona.cantidad === 0).length;

  if (!lista) return <p>Cargando lista...</p>;

  return (
    <section className="personas-pagina">
      <button className="volver-personas" onClick={() => navigate("/")}>
        <FaArrowLeft /> Mis listas
      </button>

      <div className="personas-encabezado">
        <span className="personas-etiqueta">LISTA DE PERSONAS</span>
        <h1>{lista.nombre}</h1>
        <p>Administra nombres y aportaciones.</p>
      </div>

      <div className="resumen-personas">
        <div>
          <span>Personas</span>
          <strong>{personas.length}</strong>
        </div>
        <div>
          <span>Total aportado</span>
          <strong>
            $
            {total.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
        <div>
          <span>Sin aporte</span>
          <strong>{sinAporte}</strong>
        </div>
      </div>

      <form className="formulario-persona" onSubmit={guardarPersona}>
        <h2>{editando !== null ? "Editar persona" : "Agregar persona"}</h2>

        <label htmlFor="nombrePersona">Nombre completo</label>
        <input
          id="nombrePersona"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Escribe el nombre"
          maxLength={100}
          required
        />

        <label htmlFor="cantidadPersona">Aporte o cooperación ($)</label>
        <input
          id="cantidadPersona"
          type="number"
          min="0"
          step="0.01"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="0.00"
          required
        />

        <button className="personas-boton-principal" type="submit">
          {editando !== null ? <FaCheck /> : <FaPlus />}
          {editando !== null ? "Guardar cambios" : "Agregar persona"}
        </button>

        {editando !== null && (
          <button
            type="button"
            className="personas-boton-cancelar"
            onClick={cancelarEdicion}
          >
            <FaTimes /> Cancelar edición
          </button>
        )}
      </form>

      <div className="herramientas-personas">
        <button
          onClick={() => setMostrarConfig(!mostrarConfig)}
          className="boton-herramienta"
        >
          <span>Colores y límites</span>
          <span>⚙</span>
        </button>

        <button
          onClick={capturarTabla}
          className="boton-herramienta boton-captura"
          disabled={!personas.length}
        >
          <FaCamera /> Capturar tabla
        </button>
      </div>

      {mostrarConfig && (
        <div className="configuracion-colores">
          <h2>Configuración de aportaciones</h2>

          <label className="configuracion-aporte">
            Aporte completo por persona ($)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={aporteCompleto}
              onChange={(e) => setAporteCompleto(e.target.value)}
            />
          </label>

          <p className="configuracion-ayuda">
            La mitad del aporte completo se calculará automáticamente.
          </p>

          <label>
            Sin aporte ($0)
            <input
              type="color"
              value={colorCero}
              onChange={(e) => setColorCero(e.target.value)}
            />
          </label>

          <label>
            Aporte bajo (menos de la mitad)
            <input
              type="color"
              value={colorBajo}
              onChange={(e) => setColorBajo(e.target.value)}
            />
          </label>

          <label>
            Aporte parcial (desde la mitad)
            <input
              type="color"
              value={colorParcial}
              onChange={(e) => setColorParcial(e.target.value)}
            />
          </label>

          <label>
            Aporte completo
            <input
              type="color"
              value={colorCompleto}
              onChange={(e) => setColorCompleto(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="personas-boton-principal"
            onClick={guardarConfiguracion}
          >
            <FaCheck /> Guardar configuración
          </button>
        </div>
      )}

      <div className="tabla-personas-titulo">
        <h2>Personas registradas</h2>

        <label className="orden-personas">
          <FaSort />
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="nombre">Nombre A-Z</option>
            <option value="cantidad">Mayor aporte</option>
            <option value="cantidadAsc">Menor aporte</option>
          </select>
        </label>
      </div>

      <div className="tabla-personas-captura" ref={tablaRef}>
        <div className="cabecera-captura">
          <h2>{lista.nombre}</h2>
        </div>

        <div className="tabla-personas-columnas">
          <span>PERSONA</span>
          <span>APORTE</span>
          <span className="no-captura">ACCIONES</span>
        </div>

        {personasOrdenadas.map((persona, indice) => (
          <div
            className="fila-persona"
            key={persona.id}
            style={{ backgroundColor: colorFila(persona.cantidad) }}
          >
            <div className="persona-nombre">
              <span className="persona-numero">{indice + 1}</span>

              {editando === persona.id ? (
                <span>{persona.nombre}</span>
              ) : (
                <strong>{persona.nombre}</strong>
              )}
            </div>

            <strong className="persona-cantidad">
              $
              {persona.cantidad.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>

            <div className="persona-menu no-captura">
              <button
                aria-label={`Acciones para ${persona.nombre}`}
                onClick={() =>
                  setMenuAbierto(menuAbierto === persona.id ? null : persona.id)
                }
              >
                <FaEllipsisV />
              </button>

              {menuAbierto === persona.id && (
                <div className="persona-menu-opciones">
                  <button onClick={() => iniciarEdicion(persona)}>
                    <FaPen /> Editar
                  </button>
                  <button onClick={() => eliminarPersona(persona)}>
                    <FaTrash /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {personas.length === 0 && (
          <div className="tabla-sin-personas">
            Todavía no hay personas en esta lista.
          </div>
        )}

        <div className="pie-captura">
          <span>TOTAL</span>
          <strong>
            $
            {total.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default ListasPersonas;
