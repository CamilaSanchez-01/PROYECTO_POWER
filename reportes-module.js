/**
 * Módulo de Reportes - Compatible con Google Apps Script
 * Archivo: reportes-module.js
 * 
 * Funcionalidades:
 * - Generación de reportes de asignación
 * - Exportación de datos
 * - Estadísticas del sistema
 */

// ============================================
// GENERACIÓN DE REPORTES
// ============================================

/**
 * Genera un reporte completo de asignaciones
 * @param {Array} asignaciones - Array de asignaciones realizadas
 * @param {Object} estadisticas - Estadísticas del proceso
 * @returns {string} HTML del reporte
 */
function generarReporte(asignaciones, estadisticas = {}) {
  const totalAsignaciones = asignaciones.length;
  const exitosas = asignaciones.filter(a => a.asignado).length;
  const fallidas = totalAsignaciones - exitosas;
  
  let html = `
    <div class="reporte-container">
      <div class="reporte-header">
        <h2>Reporte de Asignación de Salones</h2>
        <p class="fecha">Generado: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="reporte-resumen">
        <div class="resumen-item">
          <span class="resumen-label">Total de Asignaciones</span>
          <span class="resumen-valor">${totalAsignaciones}</span>
        </div>
        <div class="resumen-item exitoso">
          <span class="resumen-label">Asignaciones Exitosas</span>
          <span class="resumen-valor">${exitosas}</span>
        </div>
        <div class="resumen-item fallido">
          <span class="resumen-label">Asignaciones Fallidas</span>
          <span class="resumen-valor">${fallidas}</span>
        </div>
        <div class="resumen-item">
          <span class="resumen-label">Tasa de Éxito</span>
          <span class="resumen-valor">${totalAsignaciones > 0 ? ((exitosas / totalAsignaciones) * 100).toFixed(2) : 0}%</span>
        </div>
      </div>
      
      <div class="reporte-detalle">
        <h3>Detalle de Asignaciones</h3>
        <table class="tabla-reporte">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Salón Asignado</th>
              <th>Edificio</th>
              <th>Piso</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  asignaciones.forEach(asignacion => {
    const estado = asignacion.asignado ? 'Asignado' : 'No Asignado';
    const estadoClass = asignacion.asignado ? 'estado-exitoso' : 'estado-fallido';
    
    html += `
      <tr>
        <td>${asignacion.grupo || asignacion.nombreGrupo || 'N/A'}</td>
        <td>${asignacion.salon || asignacion.nombreSalon || 'N/A'}</td>
        <td>${asignacion.edificio || 'N/A'}</td>
        <td>${asignacion.piso || 'N/A'}</td>
        <td><span class="estado-badge ${estadoClass}">${estado}</span></td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  return html;
}

/**
 * Genera estadísticas del proceso de asignación
 * @param {Array} grupos - Lista de grupos procesados
 * @param {Array} salones - Lista de salones disponibles
 * @param {Array} asignaciones - Asignaciones realizadas
 * @returns {Object} Estadísticas calculadas
 */
function generarEstadisticas(grupos, salones, asignaciones) {
  const stats = {
    totalGrupos: grupos.length,
    totalSalones: salones.length,
    salonesUtilizados: 0,
    salonesDisponibles: 0,
    ocupacionPorEdificio: {},
    ocupacionPorPiso: {},
    asignacionesExitosas: 0,
    asignacionesFallidas: 0,
    capacidadTotalSalones: 0,
    capacidadUtilizada: 0,
    promedioOcupacion: 0
  };
  
  // Calcular ocupación por edificio
  const ocupacionEdificio = {};
  const ocupacionPiso = {};
  
  salones.forEach(salon => {
    const edificio = salon.edificio || 'N/A';
    const piso = salon.piso || 1;
    
    if (!ocupacionEdificio[edificio]) {
      ocupacionEdificio[edificio] = 0;
    }
    if (!ocupacionPiso[`${edificio}-${piso}`]) {
      ocupacionPiso[`${edificio}-${piso}`] = 0;
    }
  });
  
  // Procesar asignaciones
  asignaciones.forEach(asignacion => {
    if (asignacion.asignado) {
      stats.asignacionesExitosas++;
      
      const salon = salones.find(s => s.id === asignacion.salonId || s.nombre === asignacion.salon);
      if (salon) {
        const edificio = salon.edificio;
        const piso = salon.piso;
        
        ocupacionEdificio[edificio] = (ocupacionEdificio[edificio] || 0) + 1;
        ocupacionPiso[`${edificio}-${piso}`] = (ocupacionPiso[`${edificio}-${piso}`] || 0) + 1;
      }
    } else {
      stats.asignacionesFallidas++;
    }
  });
  
  stats.ocupacionPorEdificio = ocupacionEdificio;
  stats.ocupacionPorPiso = ocupacionPiso;
  stats.salonesUtilizados = Object.values(ocupacionEdificio).reduce((a, b) => a + b, 0);
  stats.salonesDisponibles = stats.totalSalones - stats.salonesUtilizados;
  
  return stats;
}

/**
 * Exporta los datos de asignación a CSV
 * @param {Array} asignaciones - Array de asignaciones
 * @param {string} nombreArchivo - Nombre del archivo a generar
 * @returns {Blob} Blob con los datos CSV
 */
function exportarACSV(asignaciones, nombreArchivo = 'reporte_asignaciones') {
  let csv = 'Grupo,Salón,Edificio,Piso,Capacidad,Estado,Hora Inicio,Hora Fin,Día\n';
  
  asignaciones.forEach(asignacion => {
    const fila = [
      asignacion.grupo || '',
      asignacion.salon || '',
      asignacion.edificio || '',
      asignacion.piso || '',
      asignacion.capacidad || '',
      asignacion.asignado ? 'Asignado' : 'No Asignado',
      asignacion.horaInicio || '',
      asignacion.horaFin || '',
      asignacion.diaSemana || ''
    ];
    csv += fila.join(',') + '\n';
  });
  
  // Crear blob para descarga
  const blob = Utilities.newBlob(csv, 'text/csv', `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
  return blob;
}

/**
 * Genera un reporte textual simple
 * @param {Array} asignaciones - Array de asignaciones
 * @returns {string} Reporte en texto plano
 */
function generarReporteTexto(asignaciones) {
  let reporte = '=== REPORTE DE ASIGNACIÓN ===\n\n';
  reporte += `Fecha: ${new Date().toLocaleString()}\n`;
  reporte += `Total de asignaciones: ${asignaciones.length}\n`;
  
  const exitosas = asignaciones.filter(a => a.asignado).length;
  const fallidas = asignaciones.length - exitosas;
  
  reporte += `Asignaciones exitosas: ${exitosas}\n`;
  reporte += `Asignaciones fallidas: ${fallidas}\n`;
  reporte += `Tasa de éxito: ${((exitosas / asignaciones.length) * 100).toFixed(2)}%\n\n`;
  
  reporte += '--- Detalle ---\n';
  asignaciones.forEach((a, index) => {
    const estado = a.asignado ? '✓' : '✗';
    reporte += `${index + 1}. [${estado}] ${a.grupo || a.nombreGrupo} -> ${a.salon || 'Sin asignar'}\n`;
    if (a.motivoFallo) {
      reporte += `   Razón: ${a.motivoFallo}\n`;
    }
  });
  
  return reporte;
}

// ============================================
// EXPORTACIÓN GLOBAL
// ============================================

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.generarReporte = generarReporte;
  window.generarEstadisticas = generarEstadisticas;
  window.exportarACSV = exportarACSV;
  window.generarReporteTexto = generarReporteTexto;
}

if (typeof globalThis !== 'undefined') {
  globalThis.generarReporte = generarReporte;
  globalThis.generarEstadisticas = generarEstadisticas;
  globalThis.exportarACSV = exportarACSV;
  globalThis.generarReporteTexto = generarReporteTexto;
}

// Log de inicialización
if (typeof logger !== 'undefined') {
  logger.info('Módulo de reportes inicializado - Compatible con Apps Script');
}
