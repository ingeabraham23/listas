import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../db/database";
import {
  FaPlus, FaUsers, FaTrash, FaPen, FaArrowRight
} from "react-icons/fa";
import "./Inicio.css";

function Inicio() {
  const [listas, setListas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  async function cargarListas() {
    setListas(await db.listas.orderBy("fechaActualizacion").reverse().toArray());
    setCargando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarListas();
  }, []);

  async function guardarLista(e) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;

    const fecha = new Date().toISOString();

    if (editando !== null) {
      await db.listas.update(editando, {
        nombre: nombreLimpio,
        fechaActualizacion: fecha
      });
    } else {
      await db.listas.add({
        nombre: nombreLimpio,
        tipo: "personas",
        fechaCreacion: fecha,
        fechaActualizacion: fecha
      });
    }

    setNombre("");
    setEditando(null);
    await cargarListas();
  }

  async function eliminarLista(lista) {
    const confirmar = window.confirm(
      `¿Eliminar la lista "${lista.nombre}" y todas sus personas?`
    );

    if (!confirmar) return;

    await db.transaction("rw", db.listas, db.personas, async () => {
      await db.personas.where("listaId").equals(lista.id).delete();
      await db.listas.delete(lista.id);
    });

    await cargarListas();
  }

  function prepararEdicion(lista) {
    setEditando(lista.id);
    setNombre(lista.nombre);
  }

  return (
    <section className="inicio">
      <div className="inicio-encabezado">
        <span className="inicio-etiqueta">ORGANIZA Y ADMINISTRA</span>
        <h1>Mis listas</h1>
        <p>Guarda tus registros en un solo lugar.</p>
      </div>

      <form className="formulario-lista" onSubmit={guardarLista}>
        <label htmlFor="nombreLista">
          {editando !== null ? "Cambiar nombre de lista" : "Nueva lista"}
        </label>

        <input
          id="nombreLista"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Cooperación del evento"
          maxLength={80}
          required
        />

        <button className="boton-principal" type="submit">
          <FaPlus />
          {editando !== null ? "Guardar nombre" : "Crear lista"}
        </button>

        {editando !== null && (
          <button
            type="button"
            className="boton-secundario"
            onClick={() => {
              setEditando(null);
              setNombre("");
            }}
          >
            Cancelar edición
          </button>
        )}
      </form>

      <div className="listas-titulo">
        <h2>Listas guardadas</h2>
        <span>{listas.length}</span>
      </div>

      {cargando ? (
        <p className="estado-vacio">Cargando listas...</p>
      ) : listas.length === 0 ? (
        <div className="estado-vacio">
          <FaUsers />
          <strong>Aún no tienes listas</strong>
          <p>Crea tu primera lista para comenzar.</p>
        </div>
      ) : (
        <div className="listas-contenedor">
          {listas.map((lista) => (
            <article className="lista-card" key={lista.id}>
              <div className="lista-icono">
                <FaUsers />
              </div>

              <button
                className="lista-abrir"
                onClick={() => navigate(`/personas/${lista.id}`)}
              >
                <strong>{lista.nombre}</strong>
                <span>Abrir lista <FaArrowRight /></span>
              </button>

              <div className="lista-acciones">
                <button
                  aria-label="Cambiar nombre"
                  title="Cambiar nombre"
                  onClick={() => prepararEdicion(lista)}
                >
                  <FaPen />
                </button>

                <button
                  className="accion-eliminar"
                  aria-label="Eliminar lista"
                  title="Eliminar lista"
                  onClick={() => eliminarLista(lista)}
                >
                  <FaTrash />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Inicio;