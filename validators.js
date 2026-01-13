/**
 * Módulo de Validadores - Compatible con Google Apps Script
 * Archivo: validators.js
 * 
 * Funcionalidades:
 * - Validación de datos de entrada
 * - Validación de archivos CSV
 * - Validación de estructuras de horario
 * - Validación de asignaciones
 */

// ============================================
// VALIDADORES DE DATOS
// ============================================

/**
 * Validador de datos principal
 */
var Validador = {
  /**
   * Valida que un valor no esté vacío
   */
  noVacio(valor, campo = 'Campo') {
    if (valor === null || valor === undefined || valor === '') {
      return { valido: false, mensaje: `${campo} no puede estar vacío` };
    }
    if (typeof valor === 'string' && valor.trim() === '') {
      return { valido: false, mensaje: `${campo} no puede contener solo espacios` };
    }
    return { valido: true };
  },
  
  /**
   * Valida que sea un número válido
   */
  esNumero(valor, campo = 'Campo') {
    if (valor === null || valor === undefined) {
      return { valido: false, mensaje: `${campo} es requerido` };
    }
    const num = parseFloat(valor);
    if (isNaN(num)) {
      return { valido: false, mensaje: `${campo} debe ser un número válido` };
    }
    return { valido: true, valor: num };
  },
  
  /**
   * Valida que sea un número entero
   */
  esEntero(valor, campo = 'Campo') {
    const resultado = this.esNumero(valor, campo);
    if (!resultado.valido) return resultado;
    
    if (!Number.isInteger(resultado.valor)) {
      return { valido: false, mensaje: `${campo} debe ser un número entero` };
    }
    return { valido: true, valor: parseInt(valor, 10) };
  },
  
  /**
   * Valida rango numérico
   */
  rango(valor, min, max, campo = 'Campo') {
    const resultado = this.esNumero(valor, campo);
    if (!resultado.valido) return resultado;
    
    if (resultado.valor < min || resultado.valor > max) {
      return { 
        valido: false, 
        mensaje: `${campo} debe estar entre ${min} y ${max}` 
      };
    }
    return { valido: true, valor: resultado.valor };
  },
  
  /**
   * Valida que sea un valor de una lista
   */
  enLista(valor, lista, campo = 'Campo') {
    if (!lista.includes(valor)) {
      return { 
        valido: false, 
        mensaje: `${campo} debe ser uno de: ${lista.join(', ')}` 
      };
    }
    return { valido: true };
  },
  
  /**
   * Valida formato de email
   */
  email(valor, campo = 'Email') {
    if (!valor) return { valido: true }; // Opcional
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(valor)) {
      return { valido: false, mensaje: `${campo} no tiene un formato válido` };
    }
    return { valido: true };
  },
  
  /**
   * Valida longitud de texto
   */
  longitud(valor, min, max, campo = 'Campo') {
    if (typeof valor !== 'string') {
      return { valido: false, mensaje: `${campo} debe ser texto` };
    }
    
    if (valor.length < min || valor.length > max) {
      return { 
        valido: false, 
        mensaje: `${campo} debe tener entre ${min} y ${max} caracteres` 
      };
    }
    return { valido: true };
  },
  
  /**
   * Valida que sea un valor positivo
   */
  positivo(valor, campo = 'Campo') {
    const resultado = this.esNumero(valor, campo);
    if (!resultado.valido) return resultado;
    
    if (resultado.valor <= 0) {
      return { valido: false, mensaje: `${campo} debe ser mayor a 0` };
    }
    return { valido: true, valor: resultado.valor };
  }
};

// ============================================
// VALIDADOR DE ARCHIVOS CSV
// ============================================

/**
 * Validador de archivos CSV
 */
var ValidadorCSV = ValidadorCSV || {
  /**
   * Valida la estructura básica de un CSV
   */
  validarEstructura: function(contenido, columnasRequeridas) {
    columnasRequeridas = columnasRequeridas || [];
    var errores = [];
    
    // Verificar que haya contenido
    if (!contenido || typeof contenido !== 'string') {
      errores.push('El archivo está vacío o no tiene contenido válido');
      return { valido: false, errores: errores };
    }
    
    // Dividir en líneas
    var lineas = contenido.trim().split(/\r?\n/);
    
    if (lineas.length < 2) {
      errores.push('El archivo debe tener al menos una cabecera y una fila de datos');
      return { valido: false, errores: errores };
    }
    
    // Validar cabecera
    var cabecera = this._parsearLineaCSV(lineas[0]);
    
    if (columnasRequeridas.length > 0) {
      var columnasFaltantes = columnasRequeridas.filter(
        function(col) { return !cabecera.some(function(c) { return c.toLowerCase().trim() === col.toLowerCase(); }); }
      );
      
      if (columnasFaltantes.length > 0) {
        errores.push('Faltan columnas requeridas: ' + columnasFaltantes.join(', '));
      }
    }
    
    // Validar que todas las filas tengan el mismo número de columnas
    var numColumnas = cabecera.length;
    for (var i = 1; i < lineas.length; i++) {
      var fila = this._parsearLineaCSV(lineas[i]);
      if (fila.length !== numColumnas) {
        errores.push('Línea ' + (i + 1) + ': Número de columnas inconsistente (esperado: ' + numColumnas + ', encontrado: ' + fila.length + ')');
      }
    }
    
    return {
      valido: errores.length === 0,
      errores: errores,
      cabecera: cabecera,
      totalLineas: lineas.length,
      columnas: numColumnas
    };
  },
  
  /**
   * Valida un archivo de horario
   */
  validarArchivoHorario: function(contenido) {
    var columnasRequeridas = [
      'clave', 'materia', 'grupo', 'carrera', 'edificio',
      'salon', 'dia', 'hora_inicio', 'hora_fin', 'profesor'
    ];
    
    var resultado = this.validarEstructura(contenido, columnasRequeridas);
    
    if (!resultado.valido) {
      return resultado;
    }
    
    // Validar datos específicos
    var errores = [];
    var lineas = contenido.trim().split(/\r?\n/);
    var datos = lineas.slice(1).map(function(linea) {
      var valores = this._parsearLineaCSV(linea);
      var cabecera = this._parsearLineaCSV(lineas[0]);
      var fila = {};
      cabecera.forEach(function(col, idx) {
        fila[col.toLowerCase()] = valores[idx];
      });
      return fila;
    }, this);
    
    // Validar horas
    var horasValidas = datos.every(function(d) {
      var inicio = this._parsearHora(d.hora_inicio);
      var fin = this._parsearHora(d.hora_fin);
      return inicio !== null && fin !== null && inicio < fin;
    }, this);
    
    if (!horasValidas) {
      errores.push('Alguna clase tiene horas inválidas (inicio >= fin)');
    }
    
    return {
      valido: errores.length === 0,
      errores: resultado.errores.concat(errores),
      datos: datos,
      cabecera: resultado.cabecera
    };
  },
  
  /**
   * Parsea una línea CSV manejando comillas
   */
  _parsearLineaCSV: function(linea) {
    var resultado = [];
    var actual = '';
    var enComillas = false;
    
    for (var i = 0; i < linea.length; i++) {
      var char = linea[i];
      
      if (char === '"') {
        if (enComillas && linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          enComillas = !enComillas;
        }
      } else if (char === ',' && !enComillas) {
        resultado.push(actual.trim());
        actual = '';
      } else {
        actual += char;
      }
    }
    
    resultado.push(actual.trim());
    return resultado;
  },
  
  /**
   * Parsea una hora en formato HH:MM
   */
  _parsearHora: function(horaStr) {
    if (!horaStr) return null;
    
    var partes = horaStr.toString().split(':');
    if (partes.length !== 2) return null;
    
    var horas = parseInt(partes[0], 10);
    var minutos = parseInt(partes[1], 10);
    
    if (isNaN(horas) || isNaN(minutos)) return null;
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
    
    return horas * 60 + minutos;
  }
};

// ============================================
// VALIDADOR DE ESTRUCTURAS DE HORARIO
// ============================================

/**
 * Validador de estructuras de horario
 */
var ValidadorHorario = ValidadorHorario || {
  /**
   * Valida un objeto Horario
   */
  validarHorario: function(horario) {
    var errores = [];
    
    if (!horario.dias || !Array.isArray(horario.dias)) {
      errores.push('El horario debe tener una propiedad "dias" como array');
    }
    
    if (!horario.horaInicio) {
      errores.push('El horario debe tener "horaInicio" definido');
    }
    
    if (!horario.horaFin) {
      errores.push('El horario debe tener "horaFin" definido');
    }
    
    if (horario.horaInicio && horario.horaFin) {
      var inicio = ValidadorCSV._parsearHora(horario.horaInicio);
      var fin = ValidadorCSV._parsearHora(horario.horaFin);
      
      if (inicio >= fin) {
        errores.push('horaInicio debe ser menor que horaFin');
      }
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    };
  },
  
  /**
   * Valida una asignación de salón
   */
  validarAsignacion: function(asignacion) {
    var errores = [];
    
    if (!asignacion.clase) {
      errores.push('La asignación debe tener una clase');
    }
    
    if (!asignacion.salon) {
      errores.push('La asignación debe tener un salón');
    }
    
    if (!asignacion.horario) {
      errores.push('La asignación debe tener un horario');
    }
    
    // Verificar conflicto
    if (asignacion.clase && asignacion.salon) {
      // Aquí se verificaría el conflicto de horario
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    };
  }
};

// ============================================
// VALIDADOR DE GRUPOS Y CLASES
// ============================================

/**
 * Validador de grupos y clases
 */
var ValidadorAcademico = ValidadorAcademico || {
  /**
   * Valida la estructura de un grupo
   */
  validarGrupo: function(grupo) {
    var errores = [];
    
    if (!grupo.id) {
      errores.push('El grupo debe tener un ID');
    }
    
    if (!grupo.nombre && !grupo.codigo) {
      errores.push('El grupo debe tener un nombre o código');
    }
    
    if (grupo.alumnos !== undefined && !Array.isArray(grupo.alumnos)) {
      errores.push('Los alumnos del grupo deben ser un array');
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    };
  },
  
  /**
   * Valida la estructura de una clase
   */
  validarClase: function(clase) {
    var errores = [];
    
    if (!clase.id) {
      errores.push('La clase debe tener un ID');
    }
    
    if (!clase.materia) {
      errores.push('La clase debe tener una materia');
    }
    
    if (!clase.grupo) {
      errores.push('La clase debe tener un grupo');
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    };
  }
};

// ============================================
// EXPORTACIÓN GLOBAL
// ============================================

// En Apps Script, el ámbito global es globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.Validador = Validador;
  globalThis.ValidadorCSV = ValidadorCSV;
  globalThis.ValidadorHorario = ValidadorHorario;
  globalThis.ValidadorAcademico = ValidadorAcademico;
}

// Log de inicialización (compatible con Apps Script)
if (typeof Logger !== 'undefined') {
  Logger.log('Módulo de validadores inicializado - Compatible con Apps Script');
}
