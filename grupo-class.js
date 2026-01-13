/**
 * CLASE GRUPO
 * Nota: Esta clase ya está definida en code.js
 * Este archivo es solo para referencia/documentación
 * 
 * Si necesitas usar Grupo en otros contextos, úsalo así:
 * const grupo = new Grupo("601", 600, 1, 1, 30);
 */

// La clase Grupo ya está definida en code.js como:
// class Grupo {
//   constructor(id, carrera, semestre, numero, cantidadAlumnos, tieneDiscapacidad = false) {
//     this.id = id;
//     this.carrera = carrera;
//     this.semestre = semestre;
//     this.numero = numero;
//     this.cantidadAlumnos = cantidadAlumnos;
//     this.tieneDiscapacidad = tieneDiscapacidad;
//     this.salonAsignado = null;
//   }
// }

// Si Grupo no está definida, la definimos (para compatibilidad)
if (typeof Grupo === 'undefined') {
  class Grupo {
    constructor(id, carrera, semestre, numero, cantidadAlumnos, tieneDiscapacidad = false) {
      this.id = id;
      this.carrera = carrera;
      this.semestre = semestre;
      this.numero = numero;
      this.cantidadAlumnos = cantidadAlumnos;
      this.tieneDiscapacidad = tieneDiscapacidad;
      this.salonAsignado = null;
    }
  }
  // Exponer globalmente
  globalThis.Grupo = Grupo;
}
