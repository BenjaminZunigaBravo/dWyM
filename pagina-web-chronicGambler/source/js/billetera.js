// source/js/billetera.js

// Variable para guardar el ID de la billetera actual
let currentWalletId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Verificamos si estamos en la página correcta
  const path = window.location.pathname.toLowerCase();
  if (!path.includes('billetera.html')) return;

  loadWalletPage();
  setupUIInteraction(); // Inicia la lógica de los botones nuevos
});

// ==========================================================
// 1. CARGA DE DATOS (Saldo e Historial)
// ==========================================================
async function loadWalletPage() {
  const user = window.getCurrentUser();
  if (!user) return;

  // A. Poner nombre en el saludo
  const nombreEl = document.getElementById('billeteraUsuarioNombre');
  if (nombreEl) nombreEl.textContent = user.username || 'Usuario';

  try {
    // B. Obtener Saldo
    const billetera = await window.fetchBilleteraForCurrentUser();

    // Si no hay billetera o da error (ej: usuario nuevo sin billetera creada)
    if (!billetera || typeof billetera.saldo === 'undefined') {
      console.warn("No se pudo obtener la billetera.");
      document.getElementById('current-balance').textContent = "$0";
      return;
    }

    currentWalletId = billetera.id; // Guardamos ID para el historial

    // C. Mostrar Saldo en el HTML Nuevo
    const saldoPrincipal = document.getElementById('current-balance');
    const saldoDisponible = document.getElementById('available-balance');

    const saldoNum = Number(billetera.saldo);
    const saldoFormat = `$${saldoNum.toLocaleString('es-CL')}`;

    if (saldoPrincipal) saldoPrincipal.textContent = saldoFormat;
    if (saldoDisponible) saldoDisponible.textContent = saldoFormat;

    // D. Cargar Historial
    if (currentWalletId) {
      loadTransactionHistory(currentWalletId);
    }

  } catch (err) {
    console.error('Error cargando datos:', err);
  }
}

// ==========================================================
// 2. LÓGICA VISUAL (Abrir/Cerrar Ventanas del HTML Nuevo)
// ==========================================================
function setupUIInteraction() {
  const btnOpenAdd = document.getElementById('btnAbrirCarga');
  const btnOpenWithdraw = document.getElementById('btnAbrirRetiro');
  const formAdd = document.getElementById('add-money-form');
  const formWithdraw = document.getElementById('withdraw-money-form');

  // Función para ocultar todo
  const hideAll = () => {
    if (formAdd) formAdd.style.display = 'none';
    if (formWithdraw) formWithdraw.style.display = 'none';
  };

  // Abrir Modales
  if (btnOpenAdd) btnOpenAdd.addEventListener('click', () => { hideAll(); formAdd.style.display = 'block'; });
  if (btnOpenWithdraw) btnOpenWithdraw.addEventListener('click', () => { hideAll(); formWithdraw.style.display = 'block'; });

  // Cerrar con la X
  document.querySelectorAll('.btnCerrarForm').forEach(btn => {
    btn.addEventListener('click', hideAll);
  });

  // Botones de monto rápido ($10.000, etc)
  document.querySelectorAll('.quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const amount = e.target.getAttribute('data-amount');
      const input = document.getElementById('add-amount');
      if (input) input.value = amount;
    });
  });

  // Iniciar la lógica de envío (Conexión con PHP)
  setupTransactionLogic();
}

// ==========================================================
// 3. LÓGICA DE TRANSACCIONES (Conexión con tu PHP)
// ==========================================================
function setupTransactionLogic() {
  const btnConfirmAdd = document.getElementById('btnConfirmarCarga');
  const btnConfirmWithdraw = document.getElementById('btnConfirmarRetiro');

  // --- CARGAR DINERO ---
  if (btnConfirmAdd) {
    // Clonamos para limpiar eventos viejos
    const newBtn = btnConfirmAdd.cloneNode(true);
    btnConfirmAdd.parentNode.replaceChild(newBtn, btnConfirmAdd);

    newBtn.addEventListener('click', async () => {
      const input = document.getElementById('add-amount');
      const monto = Number(input.value || 0);
      const user = window.getCurrentUser();

      if (monto <= 0) return alert('Ingresa un monto válido.');

      try {
        // ESTRUCTURA EXACTA QUE PIDE TU PHP BILLETERA
        const payload = {
          usuario_id: user.id,
          accion: 'cargar',
          monto: monto
        };

        await window.apiFetch('/billetera/', {
          method: 'POST',
          body: payload
        });

        alert('¡Carga exitosa!');
        input.value = '';
        document.getElementById('add-money-form').style.display = 'none';
        loadWalletPage(); // Refrescar

      } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
      }
    });
  }

  // --- RETIRAR DINERO ---
  if (btnConfirmWithdraw) {
    const newBtn = btnConfirmWithdraw.cloneNode(true);
    btnConfirmWithdraw.parentNode.replaceChild(newBtn, btnConfirmWithdraw);

    newBtn.addEventListener('click', async () => {
      const input = document.getElementById('withdraw-amount');
      const monto = Number(input.value || 0);
      const user = window.getCurrentUser();

      if (monto <= 0) return alert('Ingresa un monto válido.');

      try {
        // ESTRUCTURA EXACTA QUE PIDE TU PHP BILLETERA
        const payload = {
          usuario_id: user.id,
          accion: 'retirar',
          monto: monto
        };

        await window.apiFetch('/billetera/', {
          method: 'POST',
          body: payload
        });

        alert('¡Retiro exitoso!');
        input.value = '';
        document.getElementById('withdraw-money-form').style.display = 'none';
        loadWalletPage(); // Refrescar

      } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
      }
    });
  }
}
// ==========================================================
// 4. HISTORIAL (CORREGIDO: Sin filtro redundante)
// ==========================================================
async function loadTransactionHistory(billeteraId) {
    const container = document.getElementById('transaction-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;">Cargando...</p>';

    try {
        // Pedimos los datos (El PHP ya nos manda SOLO los de nuestra billetera)
        const allHistory = await window.apiFetch('/billetera_historico/', { method: 'GET' });

        // --- CORRECCIÓN AQUÍ ---
        // Eliminamos el .filter() porque el dato 'billetera_id' no viene en el JSON
        // y el servidor ya se encargó de darnos solo lo nuestro.
        const myHistory = Array.isArray(allHistory) ? allHistory : [];

        // Ordenamos: más nuevo primero
        myHistory.sort((a, b) => Number(b.id) - Number(a.id));

        container.innerHTML = '';

        if (myHistory.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No hay movimientos aún.</p>';
            return;
        }

        // Renderizamos
        myHistory.forEach(mov => {
            const monto = Number(mov.monto);
            
            // Si el PHP no manda 'titulo', usamos 'Movimiento'
            const label = mov.titulo || "Movimiento";
            
            // Leemos si es positivo (1) o negativo
            const esPositivo = (parseInt(mov.es_positivo) === 1);

            let classColor = esPositivo ? "gain" : "loss"; 
            let sign = esPositivo ? "+" : "-";

            // Iconos
            let icon = "🎰"; 
            const tituloLower = label.toLowerCase(); 

            if (tituloLower.includes('bono')) icon = "🎁";
            else if (tituloLower.includes('carga') || tituloLower.includes('deposito')) icon = "⬆️";
            else if (tituloLower.includes('retiro')) icon = "⬇️";

            const fecha = mov.fecha ? mov.fecha.split(' ')[0] : 'Hoy';
            const montoFmt = monto.toLocaleString('es-CL');

            const div = document.createElement('div');
            div.className = `transaction-item ${classColor}`;

            div.innerHTML = `
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-details">
                    <span class="transaction-type">${label}</span>
                    <span class="transaction-date">${fecha}</span>
                </div>
                <span class="transaction-amount ${classColor === 'gain' ? 'positive' : 'negative'}">
                    ${sign}$${montoFmt}
                </span>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error("Error historial:", err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error visualizando historial.</p>';
    }
}