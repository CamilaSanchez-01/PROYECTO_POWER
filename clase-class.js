/**
 * CLASE CLASE
 * Nota: Esta clase ya está definida en code.js
 * Este archivo es solo para referencia/documentación
 * 
 * Si necesitas usar la clase Clase en otros contextos, úsala así:
 * const datos = { codigo_asignatura: '38973', nombre_asignatura: 'Matemáticas', ... };
 * const clase = new Clase(datos);
 */

// La clase Clase ya está definida en code.js como:
// class Clase {
//   constructor(datos) {
//     this.idUnico = datos.id_unico || datos.id || Utilities.getUuid();
//     this.codigoAsignatura = datos.codigo_asignatura || datos.codigo || '';
//     this.nombreAsignatura = datos.nombre_asignatura || datos.nombre || '';
//     this.maestro = datos.maestro || datos.profesor || '';
//     this.edificioActual = datos.edificio || '';
//     this.salonActual = datos.salon || '';
//     this.capacidadRequerida = parseInt(datos.capacidad) || 0;
//     this.grupoId = datos.grupo || '';
//     this.diaSemana = datos.dia_semana || datos.dia || '';
//     this.horaInicio = datos.hora_inicio || datos.inicio || '';
//     this.horaFin = datos.hora_fin || datos.fin || '';
//     this.duracionMin = parseInt(datos.duracion_min) || 0;
//     this.modalidad = datos.modalidad || 'Presencial';
//     this.tipo = datos.tipo || 'normal';
//     this.extraerInfoGrupo();
//   }
//   
//   extraerInfoGrupo() { ... }
// }

// Si Clase no está definida, la definimos (para compatibilidad)
if (typeof Clase === 'undefined') {
  class Clase {
    constructor(datos) {
      this.idUnico = datos.id_unico || datos.id || '';
      this.codigoAsignatura = datos.codigo_asignatura || datos.codigo || '';
      this.nombreAsignatura = datos.nombre_asignatura || datos.nombre || '';
      this.maestro = datos.maestro || datos.profesor || '';
      this.edificioActual = datos.edificio || '';
      this.salonActual = datos.salon || '';
      this.capacidadRequerida = parseInt(datos.capacidad) || 0;
      this.grupoId = datos.grupo || '';
      this.diaSemana = datos.dia_semana || datos.dia || '';
      this.horaInicio = datos.hora_inicio || datos.inicio || '';
      this.horaFin = datos.hora_fin || datos.fin || '';
      this.duracionMin = parseInt(datos.duracion_min) || 0;
      this.modalidad = datos.modalidad || 'Presencial';
      this.tipo = datos.tipo || 'normal';
      this.extraerInfoGrupo();
    }

    extraerInfoGrupo() {
      if (this.grupoId && this.grupoId !== 'VIR' && this.grupoId.length >= 3) {
        const mapaCarrera = { '2': 200, '3': 300, '4': 400, '5': 500, '6': 600, '9': 900 };
        this.carrera = mapaCarrera[this.grupoId[0]] || parseInt(this.grupoId[0]) * 100;
        const s = parseInt(this.grupoId[1]);
        const n = parseInt(this.grupoId[2]);
        this.semestre = Number.isInteger(s) ? s : null;
        this.numeroGrupo = Number.isInteger(n) ? n : null;
      } else {
        this.carrera = null;
        this.semestre = null;
        this.numeroGrupo = null;
      }
    }
  }
  // Exponer globalmente
  globalThis.Clase = Clase;
}
