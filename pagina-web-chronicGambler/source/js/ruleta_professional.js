// =============================================
// SISTEMA DE RULETA PROFESIONAL (CONECTADO A BD)
// =============================================

class ProfessionalRoulette {
    constructor() {
        if (window.rouletteInstance) return window.rouletteInstance;
        
        this.balance = 0; // Se cargará de la BD
        this.currentBets = [];
        this.isSpinning = false;
        this.timeLeft = 45;
        this.timer = null;
        this.recentNumbers = []; 
        this.betHistory = [];
        this.selectedChip = 1000;
        this.rotationGlobal = 0;
        
        // Orden visual de la ruleta (para la animación)
        this.numerosRuleta = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        this.chipValues = [100, 500, 1000, 5000];
        
        window.rouletteInstance = this;
        this.init();
    }
    
    async init() {
        console.log('🎰 Conectando ruleta al casino...');
        
        // 1. Obtener saldo real
        try {
            const billetera = await window.fetchBilleteraForCurrentUser();
            if (billetera) {
                this.balance = parseFloat(billetera.saldo);
            }
        } catch (e) {
            console.error("Error cargando billetera", e);
        }

        this.stopTimer();
        this.setupEventListeners();
        this.createChipSelector();
        this.createControlButtons(); // <--- NUEVO: Botones Deshacer/Borrar
        this.updateBalance();
        this.initializeBetHistoryTable();
        this.startTimer();
    }

    // Inyecta botones de control debajo del botón GIRAR
    createControlButtons() {
        const container = document.querySelector('.text-center.my-3');
        if (!container) return;

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'control-buttons mt-2';
        controlsDiv.innerHTML = `
            <button class="btn btn-warning btn-sm mx-1" onclick="undoLastBet()">↩ Deshacer</button>
            <button class="btn btn-secondary btn-sm mx-1" onclick="clearAllBets()">🗑 Borrar Todo</button>
        `;
        container.appendChild(controlsDiv);
    }
    
    // ... createChipSelector y selectChip (se mantienen igual que tu código original) ...
    createChipSelector() {
        let saldoContainer = document.querySelector('.saldo-card-container');
        if (!saldoContainer) saldoContainer = document.querySelector('.saldo-disponible');
        if (!saldoContainer) return;
        
        const chipContainer = document.createElement('div');
        chipContainer.className = 'fichas-container';
        chipContainer.innerHTML = `
            <div class="fichas-title">Selecciona tu ficha:</div>
            <div class="fichas-buttons">
                ${this.chipValues.map(value => `
                    <button class="ficha-btn ${value === this.selectedChip ? 'activa' : ''}" 
                            data-value="${value}" 
                            onclick="window.rouletteInstance.selectChip(${value}, this)">
                        $${value}
                    </button>
                `).join('')}
            </div>
        `;
        saldoContainer.parentNode.insertBefore(chipContainer, saldoContainer.nextSibling);
    }
    
    selectChip(value, element) {
        this.selectedChip = value;
        document.querySelectorAll('.ficha-btn').forEach(btn => btn.classList.remove('activa'));
        element.classList.add('activa');
    }

    setupEventListeners() {
        const spinButton = document.getElementById('spin-button');
        if (spinButton) spinButton.onclick = () => this.spinRoulette();
        
        document.querySelectorAll('.celda').forEach(celda => {
            celda.onclick = () => this.placeBet('pleno', this.getNumber(celda), celda);
        });
        
        document.querySelectorAll('.celda-externa').forEach(celda => {
            const betType = this.getExternalBetType(celda);
            celda.onclick = () => this.placeBet('external', betType, celda);
        });
    }

    // Funciones auxiliares de celdas (igual que antes)
    getNumber(celda) { return celda.classList.contains('celda-0') ? 0 : parseInt(celda.textContent); }
    getExternalBetType(celda) {
        if (celda.classList.contains('docena1')) return 'docena1';
        if (celda.classList.contains('docena2')) return 'docena2';
        if (celda.classList.contains('docena3')) return 'docena3';
        if (celda.classList.contains('rojo')) return 'rojo';
        if (celda.classList.contains('negro')) return 'negro';
        if (celda.classList.contains('par')) return 'par';
        if (celda.classList.contains('impar')) return 'impar';
        if (celda.classList.contains('mitad1')) return 'mitad1';
        if (celda.classList.contains('mitad2')) return 'mitad2';
        return 'unknown';
    }

    // =============================================
    // APUESTAS (AHORA PERMITE APILAR)
    // =============================================
    placeBet(category, value, element) {
        if (this.isSpinning) {
            this.showMessage('Espera al siguiente turno', 'warning');
            return;
        }
        
        if (this.selectedChip > this.balance) {
            this.showMessage('Saldo insuficiente', 'error');
            return;
        }
        
        // 1. Buscar si ya apostó aquí para SUMAR (Stacking)
        const existingBet = this.currentBets.find(bet => bet.category === category && bet.value === value);
        
        if (existingBet) {
            existingBet.amount += this.selectedChip;
        } else {
            this.currentBets.push({
                category: category,
                value: value,
                amount: this.selectedChip,
                element: element
            });
        }
        
        // 2. Descontar visualmente (luego se valida en server)
        this.balance -= this.selectedChip;
        this.updateBalance();
        
        // 3. Crear ficha visual (siempre crea una nueva para efecto de "torre")
        this.createVisualChip(element, this.selectedChip);
    }
    
    createVisualChip(element, amount) {
        const chip = document.createElement('div');
        chip.className = 'ficha-apostada';
        chip.innerHTML = `$${amount}`;
        
        if (amount === 100) { chip.style.background = 'white'; chip.style.color = 'black'; }
        else if (amount === 500) { chip.style.background = '#ff3333'; chip.style.color = 'white'; }
        else if (amount === 1000) { chip.style.background = '#333'; chip.style.color = 'white'; }
        else if (amount === 5000) { chip.style.background = '#7b1fa2'; chip.style.color = 'white'; }
        
        // Posición aleatoria pequeña para efecto realista
        const randX = Math.floor(Math.random() * 6) - 3; 
        const randY = Math.floor(Math.random() * 6) - 3;
        chip.style.transform = `translate(${randX}px, ${randY}px)`;
        
        element.style.position = 'relative';
        element.appendChild(chip);
    }

    // =============================================
    // GIRO CONECTADO AL SERVIDOR
    // =============================================
   async spinRoulette() {
        if (this.isSpinning) return;
        if (this.currentBets.length === 0) {
            this.showMessage('Haz al menos una apuesta', 'error');
            return;
        }

        // ==============================================================
        // 1. ANIMACIÓN INICIAL (Girar falso para que se mueva enseguida)
        // ==============================================================
        this.isSpinning = true;
        this.stopTimer();
        const spinButton = document.getElementById('spin-button');
        const rouletteImg = document.querySelector('.ruleta-img');
        
        spinButton.disabled = true;
        spinButton.textContent = '🌀 CALCULANDO...';
        
        // Empezamos a girar visualmente "hacia el infinito" mientras esperamos al servidor
        // Esto soluciona tu molestia de que "no hace nada"
        let fakeRotation = this.rotationGlobal + 1500; 
        if (rouletteImg) {
            rouletteImg.style.transition = 'transform 10s cubic-bezier(0.1, 0.1, 0.1, 1)';
            rouletteImg.style.transform = `rotate(${fakeRotation}deg)`;
        }

        try {
            // ==============================================================
            // 2. OBTENER ID DEL USUARIO (IMPORTANTE)
            // ==============================================================
            // Asumo que guardas el ID al hacer login. 
            // Si no lo tienes, cámbialo por un número fijo (ej: 1) para probar.
            const userId = localStorage.getItem('usuario_id') || localStorage.getItem('userId') || 3; 

            // ==============================================================
            // 3. CONECTAR CON PHP (Enviando Token Fijo y User ID)
            // ==============================================================
            // Usamos fetch normal para tener control total de los headers
            const rawResponse = await fetch('api/v1/ruleta/index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer udp.2025' // <--- EL TOKEN DE TU version1.php
                },
                body: JSON.stringify({ 
                    apuestas: this.currentBets,
                    usuario_id: userId // <--- ENVIAMOS QUIÉN JUEGA
                })
            });

            const response = await rawResponse.json();

            if (!rawResponse.ok) {
                throw new Error(response.error || 'Error en el servidor');
            }

            // ==============================================================
            // 4. EL SERVIDOR YA RESPONDIÓ: "GANÓ EL 32"
            // Ahora forzamos la ruleta para que caiga en el 32 visualmente
            // ==============================================================
            const numeroGanador = parseInt(response.numero_ganador);
            
            // Cálculo Matemático (No te preocupes, esto funciona solo):
            // Busca dónde está el 32 en tu array y calcula el ángulo
            const indice = this.numerosRuleta.indexOf(numeroGanador);
            const gradosPorNumero = 360 / 37;
            const anguloDestino = 360 - (indice * gradosPorNumero);
            
            // Ajustamos el giro falso para que termine exactamente en el destino
            // Le sumamos 3 vueltas completas (1080) para dar tiempo
            const vueltasExtra = 1080; 
            const rotacionActual = fakeRotation % 360; 
            const ajuste = anguloDestino - rotacionActual;
            
            // Calculamos la posición final perfecta
            const rotacionFinal = fakeRotation + vueltasExtra + (ajuste < 0 ? ajuste + 360 : ajuste);
            
            this.rotationGlobal = rotacionFinal;

            // Actualizamos la animación para que aterrice suavemente
            if (rouletteImg) {
                rouletteImg.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)'; // Efecto frenado
                rouletteImg.style.transform = `rotate(${rotacionFinal}deg)`;
            }

            spinButton.textContent = '🎰 DETENIENDOSE...';

            // Esperar a que termine la animación visual para mostrar el dinero
            setTimeout(() => {
                this.processResultsServer(
                    numeroGanador, 
                    parseFloat(response.ganancia_total), 
                    parseFloat(response.saldo_nuevo), 
                    parseFloat(response.total_apostado)
                );
                setTimeout(() => { this.resetRound(); }, 3000);
            }, 5000); // 5 segundos de giro visual

        } catch (error) {
            console.error("Error ruleta:", error);
            this.showMessage("Error: " + error.message, 'error');
            
            // Si falló, detenemos la ruleta de golpe (o la devolvemos)
            this.isSpinning = false;
            spinButton.disabled = false;
            spinButton.textContent = '🎰 INTENTAR DE NUEVO';
            if (rouletteImg) {
                rouletteImg.style.transition = 'transform 0.5s';
                rouletteImg.style.transform = `rotate(${this.rotationGlobal}deg)`;
            }
            // Devolver saldo visual
            this.balance += this.currentBets.reduce((sum, b) => sum + b.amount, 0);
            this.updateBalance();
        }
    }
    
    processResultsServer(winningNumber, totalWinnings, newBalance, totalBet) {
        const statusText = document.querySelector('.status-text');
        
        this.showWinningNumber(winningNumber);
        this.showWinningBall(winningNumber);
        
        // Actualizar saldo real que vino del servidor
        this.balance = newBalance;
        this.updateBalance();

        const netResult = totalWinnings - totalBet;
        const colorName = winningNumber === 0 ? 'VERDE' : (this.redNumbers.includes(winningNumber) ? 'ROJO' : 'NEGRO');
        
        let message = `Salió el ${winningNumber} ${colorName}. `;
        
        if (netResult > 0) {
            message += `¡GANASTE +$${netResult.toLocaleString()}!`;
            statusText.style.color = '#00e600';
            this.playWinEffect(); // Efecto visual extra
        } else if (totalWinnings > 0) {
             message += `Recuperaste $${totalWinnings.toLocaleString()}`;
             statusText.style.color = '#ffff00';
        } else {
            message += `Suerte para la próxima.`;
            statusText.style.color = '#ff3333';
        }
        statusText.textContent = message;
        
        // Actualizar historiales visuales
        this.recentNumbers.unshift(winningNumber);
        if (this.recentNumbers.length > 5) this.recentNumbers.pop();
        this.updateRecentNumbers();
        
        // Agregar al historial de tabla
        const rowData = {
            type: totalWinnings > 0 ? 'Acierto' : 'Fallo',
            amount: totalBet,
            result: winningNumber,
            variation: totalWinnings - totalBet
        };
        this.betHistory.unshift(rowData);
        if (this.betHistory.length > 5) this.betHistory.pop();
        this.updateBetHistoryTable();
    }
    
    playWinEffect() {
        // Iluminar las apuestas ganadoras
        // (Simplificación: Ilumina donde haya fichas si ganó algo, 
        //  o podrías cruzar la lógica de ganadores aquí si quieres ser muy detallista)
        document.body.style.backgroundColor = '#1a3c20'; // Flash verde fondo
        setTimeout(() => document.body.style.backgroundColor = '', 300);
    }

    // ... showWinningNumber, showWinningBall, showMessage, updateBalance ...
    // ... updateRecentNumbers, initializeBetHistoryTable, updateBetHistoryTable ...
    // ... startTimer, stopTimer, updateTimer ...
    // (Estas funciones son visuales y se mantienen casi iguales, solo asegúrate de copiarlas del original si faltan aqui)
    
    showWinningNumber(number) {
        const span = document.querySelector('.winning-number');
        if (span) span.textContent = number;
    }

    showWinningBall(number) {
        document.querySelectorAll('.winning-ball').forEach(b => b.remove());
        const cell = Array.from(document.querySelectorAll('.celda')).find(c => this.getNumber(c) === number);
        if (cell) {
            const ball = document.createElement('div');
            ball.className = 'winning-ball';
            ball.innerHTML = '⚪';
            ball.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; z-index:100; animation:bounce 0.5s;`;
            cell.style.position = 'relative';
            cell.appendChild(ball);
        }
    }
    
    showMessage(msg, type) {
        // Implementación simple de alerta
        const statusText = document.querySelector('.status-text');
        if(statusText) {
            statusText.textContent = msg;
            statusText.style.color = type === 'error' ? 'red' : 'yellow';
        }
        alert(msg); // Fallback
    }
    
    updateBalance() {
        const el = document.getElementById('ruleta-saldo');
        if (el) el.textContent = `$${this.balance.toLocaleString()}`;
    }

    updateRecentNumbers() {
        // Lógica visual de bolitas recientes (igual que tu original)
        const tds = document.querySelectorAll('.custom-table tbody tr td');
        tds.forEach((td, i) => {
            const div = td.querySelector('div');
            const span = td.querySelector('span');
            if(!div || !span) return;
            const num = this.recentNumbers[i];
            
            div.className = 'circle-empty'; // reset
            if (num !== undefined) {
                span.textContent = num;
                if (num === 0) div.classList.add('circle-green');
                else if (this.redNumbers.includes(num)) div.classList.add('circle-red');
                else div.classList.add('circle-black');
                div.classList.remove('circle-empty');
            } else {
                span.textContent = '-';
            }
        });
    }

    initializeBetHistoryTable() { /* Igual que original */ }
    
    updateBetHistoryTable() {
        const tbody = document.getElementById('tabla-apuestas-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        this.betHistory.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${h.type}</td>
                <td>$${h.amount.toLocaleString()}</td>
                <td>${h.result}</td>
                <td class="${h.variation >= 0 ? 'text-success' : 'text-danger'}">
                    ${h.variation >= 0 ? '+' : ''}$${h.variation.toLocaleString()}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    resetRound() {
        this.currentBets = [];
        document.querySelector('.status-text').textContent = 'Recibiendo apuestas...';
        document.querySelectorAll('.ficha-apostada').forEach(c => c.remove());
        document.querySelectorAll('.winning-ball').forEach(b => b.remove());
        document.getElementById('spin-button').disabled = false;
        this.startTimer();
    }
    
    startTimer() { /* Igual original */ }
    stopTimer() { /* Igual original */ }
    updateTimer() { /* Igual original */ }

    // =============================================
    // FUNCIONES AUXILIARES DE CONTROL
    // =============================================
    clearAllBets() {
        if (this.isSpinning) return;
        // Devolver saldo visual
        this.currentBets.forEach(bet => this.balance += bet.amount);
        this.currentBets = [];
        this.updateBalance();
        document.querySelectorAll('.ficha-apostada').forEach(c => c.remove());
    }

    undoLastBet() {
        if (this.isSpinning || this.currentBets.length === 0) return;
        const last = this.currentBets.pop();
        this.balance += last.amount; // Devolver plata visual
        this.updateBalance();
        // Eliminar último hijo visual del elemento
        if (last.element.lastElementChild && last.element.lastElementChild.classList.contains('ficha-apostada')) {
            last.element.lastElementChild.remove();
        }
    }
}

// Funciones globales para los botones HTML
function clearAllBets() { window.rouletteInstance && window.rouletteInstance.clearAllBets(); }
function undoLastBet() { window.rouletteInstance && window.rouletteInstance.undoLastBet(); }

document.addEventListener('DOMContentLoaded', () => {
    window.rouletteInstance = new ProfessionalRoulette();
});