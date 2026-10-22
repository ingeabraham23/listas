import Dexie from "dexie";

export const db = new Dexie("ListasAppDB");

db.version(1).stores({
  listas: "++id, nombre, tipo, fechaCreacion, fechaActualizacion",
  personas: "++id, listaId, nombre, cantidad"
});