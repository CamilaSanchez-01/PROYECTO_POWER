/**
 * CLASE HORARIO
 * Nota: Esta clase ya está definida en code.js
 * Este archivo es solo para referencia/documentación
 * 
 * Si necesitas usar Horario en otros contextos, úsalo así:
 * const horario = new Horario("08:00", "10:00");
 */

// La clase Horario ya está definida en code.js como:
// class Horario {
//   constructor(horaInicio, horaFin) {
//     this.horaInicio = horaInicio;
//     this.horaFin = horaFin;
//   }
// }

// Si Horario no está definida, la definimos (para compatibilidad)
if (typeof Horario === 'undefined') {
  class Horario {
    constructor(horaInicio, horaFin) {
      this.horaInicio = horaInicio;
      this.horaFin = horaFin;
    }
  }
  // Exponer globalmente
  globalThis.Horario = Horario;
}
