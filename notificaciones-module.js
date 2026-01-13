/**
 * Módulo de Notificaciones - Compatible con Google Apps Script
 * Archivo: notificaciones-module.js
 * 
 * Funcionalidades:
 * - Sistema de notificaciones toast
 * - Notificaciones de progreso
 * - Alertas de éxito/error
 * - Indicadores de estado
 */

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

/**
 * Contenedor de notificaciones global
 */
const Notificaciones = {
  contenedor: null,
  pila: [],
  maxPila: 3,
  
  /**
   * Inicializa el sistema de notificaciones
   */
  init() {
    // Crear contenedor si no existe
    if (!document.getElementById('notificaciones-container')) {
      const container = document.createElement('div');
      container.id = 'notificaciones-container';
      container.className = 'notificaciones-container';
      document.body.appendChild(container);
    }
    this.contenedor = document.getElementById('notificaciones-container');
    
    if (typeof logger !== 'undefined') {
      logger.info('Sistema de notificaciones inicializado');
    }
  },
  
  /**
   * Muestra una notificación toast
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo: 'info', 'success', 'warning', 'error'
   * @param {number} duracion - Duración en milisegundos (0 = sin auto-cierre)
   */
  toast(mensaje, tipo = 'info', duracion = 4000) {
    const notificacion = {
      id: Date.now(),
      mensaje,
      tipo,
      duracion,
      timestamp: new Date()
    };
    
    this.pila.push(notificacion);
    if (this.pila.length > this.maxPila) {
      this.pila.shift();
    }
    
    this.renderizarToast(notificacion);
    
    if (duracion > 0) {
      setTimeout(() => {
        this.eliminarToast(notificacion.id);
      }, duracion);
    }
    
    return notificacion.id;
  },
  
  /**
   * Renderiza un toast individual
   */
  renderizarToast(notificacion) {
    if (!this.contenedor) {
      this.init();
    }
    
    const toast = document.createElement('div');
    toast.className = `notificacion-toast notificacion-${notificacion.tipo}`;
    toast.id = `notificacion-${notificacion.id}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    const iconos = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="notificacion-icono">${iconos[notificacion.tipo] || iconos.info}</span>
      <span class="notificacion-mensaje">${notificacion.mensaje}</span>
      <button class="notificacion-cerrar" onclick="Notificaciones.eliminarToast(${notificacion.id})">×</button>
    `;
    
    this.contenedor.appendChild(toast);
    
    // Animación de entrada
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });
  },
  
  /**
   * Elimina una notificación
   */
  eliminarToast(id) {
    const toast = document.getElementById(`notificacion-${id}`);
    if (toast) {
      toast.classList.remove('visible');
      toast.classList.add('saliendo');
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.pila = this.pila.filter(n => n.id !== id);
      }, 300);
    }
  },
  
  /**
   * Muestra progreso de una operación
   * @param {string} operacion - Nombre de la operación
   * @param {number} progreso - Porcentaje de progreso (0-100)
   * @param {string} detalle - Detalle adicional
   */
  mostrarProgreso(operacion, progreso, detalle = '') {
    let barra = document.getElementById('barra-progreso-global');
    
    if (!barra) {
      barra = document.createElement('div');
      barra.id = 'barra-progreso-global';
      barra.className = 'barra-progreso-global';
      barra.innerHTML = `
        <div class="progreso-contenedor">
          <div class="progreso-texto">
            <span id="progreso-operacion">Iniciando...</span>
            <span id="progreso-porcentaje">0%</span>
          </div>
          <div class="progreso-barra">
            <div id="progreso-fill" class="progreso-fill"></div>
          </div>
          <div id="progreso-detalle" class="progreso-detalle"></div>
        </div>
      `;
      document.body.appendChild(barra);
    }
    
    const fill = document.getElementById('progreso-fill');
    const texto = document.getElementById('progreso-operacion');
    const porcentaje = document.getElementById('progreso-porcentaje');
    const detalleEl = document.getElementById('progreso-detalle');
    
    if (fill) fill.style.width = `${Math.min(100, Math.max(0, progreso))}%`;
    if (texto) texto.textContent = operacion;
    if (porcentaje) porcentaje.textContent = `${Math.round(progreso)}%`;
    if (detalleEl) detalleEl.textContent = detalle;
    
    if (progreso >= 100) {
      setTimeout(() => {
        if (barra.parentNode) {
          barra.classList.add('completado');
          setTimeout(() => {
            if (barra.parentNode) {
              barra.parentNode.removeChild(barra);
            }
          }, 500);
        }
      }, 500);
    }
  },
  
  /**
   * Oculta la barra de progreso
   */
  ocultarProgreso() {
    const barra = document.getElementById('barra-progreso-global');
    if (barra) {
      barra.classList.add('completado');
      setTimeout(() => {
        if (barra.parentNode) {
          barra.parentNode.removeChild(barra);
        }
      }, 500);
    }
  },
  
  /**
   * Notificación de éxito
   */
  success(mensaje, duracion) {
    return this.toast(mensaje, 'success', duracion);
  },
  
  /**
   * Notificación de error
   */
  error(mensaje, duracion = 6000) {
    return this.toast(mensaje, 'error', duracion);
  },
  
  /**
   * Notificación de advertencia
   */
  warning(mensaje, duracion) {
    return this.toast(mensaje, 'warning', duracion);
  },
  
  /**
   * Notificación informativa
   */
  info(mensaje, duracion) {
    return this.toast(mensaje, 'info', duracion);
  },
  
  /**
   * Limpia todas las notificaciones
   */
  limpiarTodas() {
    const toast = this.contenedor?.querySelectorAll('.notificacion-toast');
    toast?.forEach(t => {
      t.classList.remove('visible');
      t.classList.add('saliendo');
      setTimeout(() => {
        if (t.parentNode) {
          t.parentNode.removeChild(t);
        }
      }, 300);
    });
    this.pila = [];
  }
};

// ============================================
// INDICADORES DE ESTADO
// ============================================

/**
 * Sistema de indicadores de estado visual
 */
const IndicadoresEstado = {
  elementos: {},
  
  /**
   * Crea un indicador de estado
   */
  crear(id, opciones = {}) {
    const defaults = {
      etiqueta: 'Estado',
      valor: 'Pendiente',
      tipo: 'pendiente',
      posicion: 'top-right'
    };
    
    const config = { ...defaults, ...opciones };
    
    let indicador = document.getElementById(`indicador-${id}`);
    if (!indicador) {
      indicador = document.createElement('div');
      indicador.id = `indicador-${id}`;
      indicador.className = 'indicador-estado';
      document.body.appendChild(indicador);
    }
    
    indicador.className = `indicador-estado indicador-${config.tipo}`;
    indicador.innerHTML = `
      <span class="indicador-label">${config.etiqueta}:</span>
      <span class="indicador-value">${config.valor}</span>
    `;
    
    this.elementos[id] = {
      elemento: indicador,
      config
    };
    
    return indicador;
  },
  
  /**
   * Actualiza un indicador
   */
  actualizar(id, tipo, valor) {
    const indicador = this.elementos[id];
    if (indicador) {
      indicador.config.tipo = tipo;
      indicador.config.valor = valor;
      indicador.elemento.className = `indicador-estado indicador-${tipo}`;
      indicador.elemento.querySelector('.indicador-value').textContent = valor;
    }
  },
  
  /**
   * Elimina un indicador
   */
  eliminar(id) {
    const indicador = this.elementos[id];
    if (indicador && indicador.elemento.parentNode) {
      indicador.elemento.parentNode.removeChild(indicador.elemento);
      delete this.elementos[id];
    }
  }
};

// ============================================
// EXPORTACIÓN GLOBAL
// ============================================

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.Notificaciones = Notificaciones;
  window.IndicadoresEstado = IndicadoresEstado;
}

if (typeof globalThis !== 'undefined') {
  globalThis.Notificaciones = Notificaciones;
  globalThis.IndicadoresEstado = IndicadoresEstado;
}

// ============================================
// CSS INCORPORADO
// ============================================

const estilosNotificaciones = `
  .notificaciones-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
  }
  
  .notificacion-toast {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    border-left: 4px solid #2196F3;
  }
  
  .notificacion-toast.visible {
    opacity: 1;
    transform: translateX(0);
  }
  
  .notificacion-toast.saliendo {
    opacity: 0;
    transform: translateX(100%);
  }
  
  .notificacion-success {
    border-left-color: #4CAF50;
    background: #E8F5E9;
  }
  
  .notificacion-error {
    border-left-color: #F44336;
    background: #FFEBEE;
  }
  
  .notificacion-warning {
    border-left-color: #FF9800;
    background: #FFF3E0;
  }
  
  .notificacion-info {
    border-left-color: #2196F3;
    background: #E3F2FD;
  }
  
  .notificacion-icono {
    font-size: 18px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255,255,255,0.8);
  }
  
  .notificacion-mensaje {
    flex: 1;
    font-size: 14px;
    color: #333;
  }
  
  .notificacion-cerrar {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    padding: 0;
    line-height: 1;
  }
  
  .notificacion-cerrar:hover {
    color: #333;
  }
  
  .barra-progreso-global {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    padding: 16px 24px;
    z-index: 10000;
    min-width: 300px;
  }
  
  .progreso-contenedor {
    text-align: center;
  }
  
  .progreso-texto {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333;
  }
  
  .progreso-barra {
    height: 8px;
    background: #E0E0E0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progreso-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    border-radius: 4px;
    transition: width 0.3s ease;
    width: 0%;
  }
  
  .progreso-detalle {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
  }
  
  .indicador-estado {
    position: fixed;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    z-index: 9999;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .indicador-procesando {
    background: #E3F2FD;
    color: #1976D2;
  }
  
  .indicador-completado {
    background: #E8F5E9;
    color: #388E3C;
  }
  
  .indicador-error {
    background: #FFEBEE;
    color: #D32F2F;
  }
  
  .indicador-pendiente {
    background: #FFF3E0;
    color: #F57C00;
  }
`;

// Injectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = estilosNotificaciones;
  document.head.appendChild(styleSheet);
}

// Log de inicialización
if (typeof logger !== 'undefined') {
  logger.info('Módulo de notificaciones inicializado - Compatible con Apps Script');
}
