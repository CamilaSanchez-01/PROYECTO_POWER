/**
 * CLASE SALON
 * Nota: Esta clase ya está definida en code.js
 * Este archivo es solo para referencia/documentación
 * 
 * Si necesitas usar Salon en otros contextos, úsalo así:
 * const salon = new Salon("F-101", "F", 1, 40, true);
 */

// La clase Salon ya está definida en code.js como:
// class Salon {
//   constructor(id, edificio, piso, capacidad, accesible = false) {
//     this.id = id;
//     this.edificio = edificio;
//     this.piso = piso;
//     this.capacidad = capacidad;
//     this.accesible = accesible;
//     this.horariosOcupados = [];
//     this.grupoAsignadoFijo = null;
//   }
//   
//   estaDisponible(horario, dia) { ... }
//   ocupar(dia, horario, grupoId) { ... }
//   liberarHorarios(grupoId) { ... }
// }

// Si Salon no está definida, la definimos (para compatibilidad)
if (typeof Salon === 'undefined') {
  class Salon {
    constructor(id, edificio, piso, capacidad, accesible = false) {
      this.id = id;
      this.edificio = edificio;
      this.piso = piso;
      this.capacidad = capacidad;
      this.accesible = accesible;
      this.horariosOcupados = [];
      this.grupoAsignadoFijo = null;
    }

    estaDisponible(horario, dia) {
      return !this.horariosOcupados.some(h =>
        h.dia === dia && this.horariosSeSuperponen(h.horario, horario)
      );
    }

    horariosSeSuperponen(horario1, horario2) {
      const inicio1 = this.convertirHoraAMinutos(horario1.horaInicio);
      const fin1 = this.convertirHoraAMinutos(horario1.horaFin);
      const inicio2 = this.convertirHoraAMinutos(horario2.horaInicio);
      const fin2 = this.convertirHoraAMinutos(horario2.horaFin);
      return inicio1 < fin2 && fin1 > inicio2;
    }

    convertirHoraAMinutos(hora) {
      const [horas, minutos] = hora.split(':').map(Number);
      return horas * 60 + minutos;
    }

    ocupar(dia, horario, grupoId) {
      const existe = this.horariosOcupados.some(h =>
        h.dia === dia &&
        h.horario.horaInicio === horario.horaInicio &&
        h.horario.horaFin === horario.horaFin
      );
      if (!existe) {
        this.horariosOcupados.push({ dia, horario, grupoId });
      }
    }

    liberarHorarios(grupoId) {
      this.horariosOcupados = this.horariosOcupados.filter(h => h.grupoId !== grupoId);
      this.grupoAsignadoFijo = null;
    }
  }
  // Exponer globalmente
  globalThis.Salon = Salon;
}
