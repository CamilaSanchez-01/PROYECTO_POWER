/**
 * PROCESADOR DE HORARIOS
 * Versión compatible con Google Apps Script
 * 
 * Este archivo procesa datos de horarios y agrupa por día/grupo
 * Versión para Apps Script: los datos se pasan como parámetros
 * en lugar de leer archivos del sistema
 */

/**
 * Parsea contenido CSV a array de objetos
 * @param {string} content - Contenido CSV
 * @returns {Array} Array de objetos
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : '';
    });
    return obj;
  });
}

/**
 * Procesa datos de horarios (versión Apps Script)
 * @param {Array} allData - Array de objetos con datos de horarios
 * @returns {Object} Datos procesados agrupados
 */
function procesarHorarios(allData) {
  if (!allData || !Array.isArray(allData)) {
    return { error: 'Datos inválidos' };
  }

  // Filtrar datos relevantes
  const relevantData = allData.map(row => ({
    grupo: row.grupo || row.grupoId,
    dia_semana: row.dia_semana || row.dia,
    hora_inicio: row.hora_inicio || row.inicio,
    hora_fin: row.hora_fin || row.fin,
    salon: row.salon || row.salonId
  }));

  // Agrupar por día y grupo
  const grouped = {};

  relevantData.forEach(item => {
    if (!item.dia_semana || !item.grupo) return;
    const key = `${item.dia_semana.toUpperCase()}_${item.grupo}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({
      start: item.hora_inicio,
      end: item.hora_fin,
      salon: item.salon
    });
  });

  // Procesar cada grupo
  const processed = {};

  Object.keys(grouped).forEach(key => {
    const [dia, grupo] = key.split('_');
    const blocks = grouped[key];

    // Ordenar por hora_inicio
    blocks.sort((a, b) => a.start.localeCompare(b.start));

    // Eliminar duplicados
    const uniqueBlocks = [];
    const seen = new Set();
    blocks.forEach(block => {
      const blockKey = `${block.start}_${block.end}`;
      if (!seen.has(blockKey)) {
        seen.add(blockKey);
        uniqueBlocks.push(block);
      }
    });

    // Consolidar continuos
    const consolidated = [];
    uniqueBlocks.forEach(block => {
      if (consolidated.length === 0) {
        consolidated.push(block);
      } else {
        const last = consolidated[consolidated.length - 1];
        if (last.end === block.start) {
          last.end = block.end;
        } else {
          consolidated.push(block);
        }
      }
    });

    if (!processed[dia]) {
      processed[dia] = {};
    }
    processed[dia][grupo] = consolidated;
  });

  return processed;
}

/**
 * Genera salida formateada
 * @param {Object} processed - Datos procesados
 * @returns {string} Salida formateada
 */
function formatOutput(processed) {
  const output = [];
  const diasOrden = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

  diasOrden.forEach(dia => {
    if (processed[dia]) {
      output.push(dia);
      const grupos = Object.keys(processed[dia]).sort();
      grupos.forEach(grupo => {
        output.push(`Grupo ${grupo}`);
        processed[dia][grupo].forEach(block => {
          output.push(`${block.start} - ${block.end}`);
        });
        output.push('');
      });
      output.push('');
    }
  });

  return output.join('\n');
}

/**
 * Función de prueba
 */
function testProcesarHorarios() {
  const testData = [
    { grupo: '601', dia_semana: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', salon: 'F-101' },
    { grupo: '601', dia_semana: 'Lunes', hora_inicio: '10:00', hora_fin: '12:00', salon: 'F-101' },
    { grupo: '601', dia_semana: 'Miércoles', hora_inicio: '08:00', hora_fin: '10:00', salon: 'F-102' },
    { grupo: '602', dia_semana: 'Lunes', hora_inicio: '14:00', hora_fin: '16:00', salon: 'D-201' }
  ];

  const result = procesarHorarios(testData);
  console.log('Resultado:', JSON.stringify(result, null, 2));
  console.log('\nSalida formateada:');
  console.log(formatOutput(result));
}
