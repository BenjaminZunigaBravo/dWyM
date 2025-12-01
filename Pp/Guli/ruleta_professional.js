// =============================================
// SISTEMA DE RULETA PROFESIONAL - INSPIRADO EN JORDI
// =============================================

class ProfessionalRoulette {
    constructor() {
        // Verificar si ya hay una instancia
        if (window.rouletteInstance) {
            console.warn('Ya existe una instancia de ruleta');
            return window.rouletteInstance;
        }
        
        this.balance = 19485948;
        this.currentBets = [];
        this.isSpinning = false;
        this.timeLeft = 45;
        this.timer = null;
        this.recentNumbers = [17, 0, 23, 8, 12]; // Números de prueba con diferentes colores
        this.betHistory = [];
        this.selectedChip = 1000; // Ficha seleccionada por defecto
        this.rotationGlobal = 0; // Para mantener posición de la ruleta
        
        // Orden OFICIAL de la Ruleta Europea (igual que Jordi)
        this.numerosRuleta = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        
        // Fichas disponibles
        this.chipValues = [100, 500, 1000, 5000];
        
        // Guardar referencia
        window.rouletteInstance = this;
        
        this.init();
    }
    
    init() {
        console.log('🎰 Inicializando ruleta profesional...');
        
        this.stopTimer();
        this.setupEventListeners();
        this.createChipSelector();
        this.updateBalance();
        this.updateRecentNumbers();
        this.initializeBetHistoryTable();
        this.startTimer();
    }
    
    // =============================================
    // SELECTOR DE FICHAS (COMO JORDI)
    // =============================================
    
    createChipSelector() {
        // Buscar el nuevo contenedor de saldo
        let saldoContainer = document.querySelector('.saldo-card-container');
        
        // Fallback para el diseño anterior
        if (!saldoContainer) {
            saldoContainer = document.querySelector('.saldo-disponible');
        }
        
        if (!saldoContainer) return;
        
        // Crear contenedor de fichas después del saldo
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
        console.log(`Ficha seleccionada: $${value}`);
    }
    
    // =============================================
    // LISTENERS MEJORADOS
    // =============================================
    
    setupEventListeners() {
        // Botón de girar
        const spinButton = document.getElementById('spin-button');
        if (spinButton) {
            spinButton.onclick = () => this.spinRoulette();
        }
        
        // Celdas de números
        document.querySelectorAll('.celda').forEach(celda => {
            celda.onclick = () => this.placeBet('pleno', this.getNumber(celda), celda);
        });
        
        // Apuestas externas
        document.querySelectorAll('.celda-externa').forEach(celda => {
            const betType = this.getExternalBetType(celda);
            celda.onclick = () => this.placeBet('external', betType, celda);
        });
    }
    
    getNumber(celda) {
        if (celda.classList.contains('celda-0')) return 0;
        return parseInt(celda.textContent);
    }
    
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
    // SISTEMA DE APUESTAS PROFESIONAL
    // =============================================
    
    placeBet(category, value, element) {
        if (this.isSpinning) {
            this.showMessage('La ruleta está girando, espera al siguiente turno', 'warning');
            return;
        }
        
        if (this.selectedChip > this.balance) {
            this.showMessage('No tienes suficiente saldo para esta ficha', 'error');
            return;
        }
        
        // Verificar si ya hay una apuesta en esta posición
        const existingBet = this.currentBets.find(bet => 
            bet.category === category && bet.value === value
        );
        
        if (existingBet) {
            this.showMessage(`Ya hay una apuesta de $${existingBet.amount} en ${this.getBetDisplayName(value)}`, 'info');
            return;
        }
        
        // Crear nueva apuesta
        const newBet = {
            category: category,
            value: value,
            amount: this.selectedChip,
            element: element
        };
        
        this.currentBets.push(newBet);
        this.balance -= this.selectedChip;
        this.updateBalance();
        
        // Crear ficha visual (como Jordi)
        this.createVisualChip(element, this.selectedChip);
        
        this.showMessage(`Apostaste $${this.selectedChip.toLocaleString()} en ${this.getBetDisplayName(value)}`, 'success');
    }
    
    createVisualChip(element, amount) {
        const chip = document.createElement('div');
        chip.className = 'ficha-apostada';
        chip.innerHTML = `$${amount}`;
        
        // Colores según valor (como Jordi)
        if (amount === 100) {
            chip.style.background = 'white';
            chip.style.color = 'black';
        } else if (amount === 500) {
            chip.style.background = '#ff3333';
            chip.style.color = 'white';
        } else if (amount === 1000) {
            chip.style.background = '#333';
            chip.style.color = 'white';
        } else if (amount === 5000) {
            chip.style.background = '#7b1fa2';
            chip.style.color = 'white';
        }
        
        // Posición aleatoria para apilamiento natural
        const randX = Math.floor(Math.random() * 10) - 5;
        const randY = Math.floor(Math.random() * 10) - 5;
        chip.style.transform = `translate(${randX}px, ${randY}px)`;
        
        element.style.position = 'relative';
        element.appendChild(chip);
    }
    
    // =============================================
    // GIRO PROFESIONAL (MATEMÁTICAS PRECISAS DE JORDI)
    // =============================================
    
    spinRoulette() {
        if (this.isSpinning) return;
        if (this.currentBets.length === 0) {
            this.showMessage('¡La mesa está vacía! Haz al menos una apuesta', 'error');
            return;
        }
        
        this.isSpinning = true;
        this.stopTimer();
        
        const spinButton = document.getElementById('spin-button');
        const statusText = document.querySelector('.status-text');
        const rouletteImg = document.querySelector('.ruleta-img');
        
        // Cambiar estado
        spinButton.disabled = true;
        spinButton.textContent = '🌀 GIRANDO...';
        statusText.textContent = '¡NO VA MÁS! Girando...';
        
        // A) Elegir ganador aleatorio
        const indiceGanador = Math.floor(Math.random() * this.numerosRuleta.length);
        const numeroGanador = this.numerosRuleta[indiceGanador];
        
        // B) Matemáticas de precisión (igual que Jordi)
        const gajoGrados = 360 / 37; // aprox 9.729 grados
        const anguloObjetivo = 360 - (indiceGanador * gajoGrados);
        
        // JITTER: variación aleatoria para naturalidad
        const aleatoriedad = (Math.random() * (gajoGrados * 0.8)) - (gajoGrados * 0.4);
        
        const rotacionActual = this.rotationGlobal % 360;
        let delta = (anguloObjetivo + aleatoriedad) - rotacionActual;
        
        if (delta < 0) delta += 360;
        
        // Giros extra para emoción + diferencia calculada
        const rotacionFinal = this.rotationGlobal + 1800 + delta;
        this.rotationGlobal = rotacionFinal;
        
        // C) Ejecutar animación CSS
        if (rouletteImg) {
            rouletteImg.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
            rouletteImg.style.transform = `rotate(${rotacionFinal}deg)`;
        }
        
        // D) Esperar resultado (5 segundos)
        setTimeout(() => {
            this.processResults(numeroGanador);
            
            setTimeout(() => {
                this.resetRound();
            }, 3000);
        }, 5000);
    }
    
    // =============================================
    // PROCESAMIENTO DE RESULTADOS (MEJORADO)
    // =============================================
    
    processResults(winningNumber) {
        this.isSpinning = false;
        
        const statusText = document.querySelector('.status-text');
        const spinButton = document.getElementById('spin-button');
        
        // Mostrar resultado
        this.showWinningNumber(winningNumber);
        this.showWinningBall(winningNumber);
        
        let totalWinnings = 0;
        let totalBet = 0;
        const roundResults = [];
        
        // Calcular total apostado
        this.currentBets.forEach(bet => totalBet += bet.amount);
        
        // Propiedades del número ganador
        const isRed = this.redNumbers.includes(winningNumber);
        const isBlack = !isRed && winningNumber !== 0;
        const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
        const isOdd = winningNumber !== 0 && winningNumber % 2 !== 0;
        
        // Procesar cada apuesta
        this.currentBets.forEach(bet => {
            let won = false;
            let payout = 0;
            
            if (bet.category === 'pleno') {
                if (bet.value === winningNumber) {
                    won = true;
                    payout = bet.amount * 36; // 35:1 + apuesta original
                }
            } else {
                switch (bet.value) {
                    case 'rojo':
                        if (isRed) { won = true; payout = bet.amount * 2; }
                        break;
                    case 'negro':
                        if (isBlack) { won = true; payout = bet.amount * 2; }
                        break;
                    case 'par':
                        if (isEven) { won = true; payout = bet.amount * 2; }
                        break;
                    case 'impar':
                        if (isOdd) { won = true; payout = bet.amount * 2; }
                        break;
                    case 'mitad1':
                        if (winningNumber >= 1 && winningNumber <= 18) { won = true; payout = bet.amount * 2; }
                        break;
                    case 'mitad2':
                        if (winningNumber >= 19 && winningNumber <= 36) { won = true; payout = bet.amount * 2; }
                        break;
                    case 'docena1':
                        if (winningNumber >= 1 && winningNumber <= 12) { won = true; payout = bet.amount * 3; }
                        break;
                    case 'docena2':
                        if (winningNumber >= 13 && winningNumber <= 24) { won = true; payout = bet.amount * 3; }
                        break;
                    case 'docena3':
                        if (winningNumber >= 25 && winningNumber <= 36) { won = true; payout = bet.amount * 3; }
                        break;
                }
            }
            
            if (won) {
                totalWinnings += payout;
                // Efecto visual de ganancia
                bet.element.style.boxShadow = '0 0 20px #00ff00';
            }
            
            // Guardar para historial
            roundResults.push({
                type: this.getBetDisplayName(bet.value),
                amount: bet.amount,
                result: won ? 'Ganado' : 'Perdido',
                variation: won ? payout - bet.amount : -bet.amount
            });
        });
        
        // Actualizar balance
        this.balance += totalWinnings;
        this.updateBalance();
        
        // Resultado neto
        const netResult = totalWinnings - totalBet;
        
        // Mostrar mensaje de resultado
        const colorName = winningNumber === 0 ? 'VERDE' : (isRed ? 'ROJO' : 'NEGRO');
        let message = `Salió el ${winningNumber} ${colorName}. `;
        
        if (netResult > 0) {
            message += `¡GANASTE +$${netResult.toLocaleString()}!`;
            statusText.style.color = '#00e600';
        } else if (netResult < 0) {
            message += `Perdiste -$${Math.abs(netResult).toLocaleString()}`;
            statusText.style.color = '#ff3333';
        } else {
            message += `Recuperaste tu apuesta`;
            statusText.style.color = 'white';
        }
        
        statusText.textContent = message;
        
        // Actualizar historial
        this.recentNumbers.unshift(winningNumber);
        if (this.recentNumbers.length > 5) this.recentNumbers.pop();
        this.updateRecentNumbers();
        
        roundResults.forEach(result => {
            this.betHistory.unshift(result);
        });
        if (this.betHistory.length > 20) {
            this.betHistory = this.betHistory.slice(0, 20);
        }
        this.updateBetHistoryTable();
        
        // Restablecer botón
        spinButton.disabled = false;
        spinButton.textContent = '🎰 GIRAR RULETA';
    }
    
    getBetDisplayName(value) {
        if (typeof value === 'number') {
            return `Número ${value}`;
        }
        
        switch (value) {
            case 'rojo': return 'Rojo';
            case 'negro': return 'Negro';
            case 'par': return 'Par';
            case 'impar': return 'Impar';
            case 'mitad1': return '1-18';
            case 'mitad2': return '19-36';
            case 'docena1': return '1ra Docena';
            case 'docena2': return '2da Docena';
            case 'docena3': return '3ra Docena';
            default: return value;
        }
    }
    
    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================
    
    clearAllBets() {
        if (this.isSpinning) return;
        
        // Devolver dinero
        this.currentBets.forEach(bet => {
            this.balance += bet.amount;
        });
        
        this.currentBets = [];
        this.updateBalance();
        
        // Eliminar fichas visuales
        document.querySelectorAll('.ficha-apostada').forEach(chip => chip.remove());
        document.querySelectorAll('.celda, .celda-externa').forEach(cell => {
            cell.style.boxShadow = '';
        });
        
        this.showMessage('Mesa limpia. Haz tus apuestas', 'info');
    }
    
    undoLastBet() {
        if (this.isSpinning || this.currentBets.length === 0) return;
        
        const lastBet = this.currentBets.pop();
        this.balance += lastBet.amount;
        this.updateBalance();
        
        // Eliminar ficha visual
        const chips = lastBet.element.querySelectorAll('.ficha-apostada');
        if (chips.length > 0) {
            chips[chips.length - 1].remove();
        }
        
        this.showMessage('Última apuesta deshecha', 'info');
    }
    
    doubleBets() {
        if (this.isSpinning || this.currentBets.length === 0) return;
        
        const totalNeeded = this.currentBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (this.balance < totalNeeded) {
            this.showMessage('No tienes saldo suficiente para doblar', 'error');
            return;
        }
        
        // Doblar cada apuesta
        const newBets = [...this.currentBets];
        newBets.forEach(bet => {
            this.balance -= bet.amount;
            this.currentBets.push({...bet});
            this.createVisualChip(bet.element, bet.amount);
        });
        
        this.updateBalance();
        this.showMessage('¡Apuestas DOBLADAS!', 'success');
    }
    
    // =============================================
    // EFECTOS VISUALES Y UI
    // =============================================
    
    showWinningNumber(number) {
        const winningNumberSpan = document.querySelector('.winning-number');
        if (winningNumberSpan) {
            winningNumberSpan.textContent = number;
        }
    }
    
    showWinningBall(number) {
        document.querySelectorAll('.winning-ball').forEach(ball => ball.remove());
        
        const winningCell = Array.from(document.querySelectorAll('.celda')).find(celda => {
            return this.getNumber(celda) === number;
        });
        
        if (winningCell) {
            const ball = document.createElement('div');
            ball.className = 'winning-ball';
            ball.innerHTML = '⚪';
            ball.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 20px;
                z-index: 1000;
                animation: bounce 0.5s ease-in-out;
            `;
            winningCell.style.position = 'relative';
            winningCell.appendChild(ball);
        }
        
        // Activar efecto del triangulito indicador
        const triangulo = document.querySelector('.triangulo-indicador');
        if (triangulo) {
            triangulo.classList.remove('winning');
            setTimeout(() => {
                triangulo.classList.add('winning');
            }, 100);
            
            // Quitar el efecto después de la animación
            setTimeout(() => {
                triangulo.classList.remove('winning');
            }, 3000);
        }
    }
    
    showMessage(message, type) {
        const alert = document.querySelector('.alert');
        if (alert) {
            const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
            alert.className = `alert alert-${alertClass} d-flex align-items-center justify-content-center`;
            alert.querySelector('div').innerHTML = `<strong>¡${type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Info'}!</strong> ${message}`;
        }
    }
    
    updateBalance() {
        // Actualizar el nuevo diseño del saldo
        const saldoAmountNew = document.querySelector('.saldo-amount-new');
        if (saldoAmountNew) {
            saldoAmountNew.textContent = `$${this.balance.toLocaleString()}`;
        }
        
        // Fallback para el diseño anterior (si existe)
        const saldoAmount = document.querySelector('.saldo-amount');
        if (saldoAmount) {
            saldoAmount.innerHTML = `$${this.balance.toLocaleString()} <span class="currency">CLP</span>`;
        }
    }
    
    updateRecentNumbers() {
        const circleContainers = document.querySelectorAll('.custom-table tbody tr td');
        console.log('Actualizando números recientes:', this.recentNumbers); // Debug
        
        circleContainers.forEach((container, index) => {
            const circle = container.querySelector('div');
            const numberSpan = container.querySelector('.circle-number');
            
            if (circle && numberSpan) {
                if (this.recentNumbers[index] !== undefined) {
                    const number = this.recentNumbers[index];
                    numberSpan.textContent = number;
                    
                    // Limpiar todas las clases de color previas
                    circle.classList.remove('circle-empty', 'circle-red', 'circle-black', 'circle-green');
                    
                    // Aplicar la clase correcta basada en el número
                    if (number === 0) {
                        circle.classList.add('circle-green');
                    } else if (this.redNumbers.includes(number)) {
                        circle.classList.add('circle-red');
                    } else {
                        circle.classList.add('circle-black');
                    }
                    
                    console.log(`Número ${number} en posición ${index}, clases: ${circle.className}`); // Debug
                } else {
                    numberSpan.textContent = '-';
                    circle.classList.remove('circle-red', 'circle-black', 'circle-green');
                    circle.classList.add('circle-empty');
                }
            }
        });
    }
    
    initializeBetHistoryTable() {
        const tbody = document.querySelector('.tabla-apuestas tbody');
        if (tbody) {
            tbody.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>-</td><td>-</td><td>-</td><td>-</td>`;
                tbody.appendChild(row);
            }
        }
    }
    
    updateBetHistoryTable() {
        const tbody = document.querySelector('.tabla-apuestas tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const displayResults = this.betHistory.slice(0, 5);
        
        displayResults.forEach(result => {
            const row = document.createElement('tr');
            const variationClass = result.variation > 0 ? 'ganado' : 'perdido';
            const variationSign = result.variation > 0 ? '+' : '';
            
            row.innerHTML = `
                <td>${result.type}</td>
                <td>$${result.amount.toLocaleString()}</td>
                <td>${result.result}</td>
                <td class="${variationClass}">${variationSign}${result.variation.toLocaleString()}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        while (tbody.children.length < 5) {
            const row = document.createElement('tr');
            row.innerHTML = `<td>-</td><td>-</td><td>-</td><td>-</td>`;
            tbody.appendChild(row);
        }
    }
    
    startTimer() {
        this.timeLeft = 45;
        this.updateTimer();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.timeLeft = 45;
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateTimer() {
        const timer = document.querySelector('.countdown-timer');
        if (timer) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    resetRound() {
        this.currentBets = [];
        
        const statusText = document.querySelector('.status-text');
        statusText.textContent = 'Recibiendo apuestas...';
        statusText.style.color = 'white';
        
        // Limpiar fichas visuales
        document.querySelectorAll('.ficha-apostada').forEach(chip => chip.remove());
        document.querySelectorAll('.celda, .celda-externa').forEach(cell => {
            cell.style.boxShadow = '';
        });
        
        // Remover bolas
        document.querySelectorAll('.winning-ball').forEach(ball => ball.remove());
        
        this.startTimer();
    }
}

// =============================================
// FUNCIONES GLOBALES
// =============================================

function testBallPosition(number) {
    if (window.rouletteInstance) {
        window.rouletteInstance.showWinningBall(number);
        console.log(`Probando posición de bolita en número ${number}`);
    }
}

function runFullTest() {
    if (!window.rouletteInstance) return;
    
    let currentNumber = 0;
    const testInterval = setInterval(() => {
        testBallPosition(currentNumber);
        currentNumber++;
        
        if (currentNumber > 36) {
            clearInterval(testInterval);
            console.log('Test completo finalizado');
        }
    }, 500);
}

function clearAllBets() {
    if (window.rouletteInstance) {
        window.rouletteInstance.clearAllBets();
    }
}

function undoLastBet() {
    if (window.rouletteInstance) {
        window.rouletteInstance.undoLastBet();
    }
}

function doubleBets() {
    if (window.rouletteInstance) {
        window.rouletteInstance.doubleBets();
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.rouletteInstance) {
        console.log('🎰 Ruleta ya inicializada, saltando...');
        return;
    }
    
    window.rouletteInstance = new ProfessionalRoulette();
    console.log('🎰 Sistema de Ruleta Profesional inicializado');
    console.log('Comandos disponibles: testBallPosition(número), runFullTest(), clearAllBets(), undoLastBet(), doubleBets()');
    
    // Agregar estilos profesionales
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.5); }
        }
        
        /* Selector de fichas */
        .fichas-container {
            background: rgba(42, 42, 42, 0.9);
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            border: 1px solid #444;
        }
        
        .fichas-title {
            color: #d4af37;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .fichas-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .ficha-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px dashed white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
            color: black;
            box-shadow: 0 3px 5px rgba(0,0,0,0.5);
            background: white;
        }
        
        .ficha-btn:hover {
            transform: scale(1.1);
        }
        
        .ficha-btn.activa {
            transform: scale(1.1);
            border: 3px solid #fff200;
            box-shadow: 0 0 15px #fff200;
        }
        
        .ficha-btn[data-value="100"] { background: white; color: black; }
        .ficha-btn[data-value="500"] { background: #ff3333; color: white; border-color: darkred; }
        .ficha-btn[data-value="1000"] { background: #333; color: white; border-color: black; }
        .ficha-btn[data-value="5000"] { background: #7b1fa2; color: white; border-color: indigo; }
        
        /* Fichas apostadas */
        .ficha-apostada {
            position: absolute;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px dashed #333;
            color: black;
            font-size: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 5;
            box-shadow: 0 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            font-weight: bold;
        }
        
        /* Círculos de historial */
        .circle-empty,
        .circle-red,
        .circle-black,
        .circle-green { 
            border-radius: 50%; 
            width: 30px; 
            height: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold;
            margin: 0 auto;
            border: 2px solid #fff;
        }
        
        .circle-empty {
            background-color: #6c757d;
            color: white;
        }
        
        .circle-red { 
            background-color: #dc3545; 
            color: white; 
        }
        
        .circle-black { 
            background-color: #000; 
            color: white; 
        }
        
        .circle-green { 
            background-color: #28a745; 
            color: white; 
        }
        
        /* Resultados */
        .ganado {
            color: #28a745;
            font-weight: bold;
        }
        
        .perdido {
            color: #dc3545;
            font-weight: bold;
        }
        
        /* Efectos de giro mejorados */
        .ruleta-img {
            transition: transform 5s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        
        /* Botones de control adicionales */
        .control-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 10px 0;
            flex-wrap: wrap;
        }
        
        .control-btn {
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
        }
        
        .control-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .control-btn.danger {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        }
        
        .control-btn.success {
            background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
        }
    `;
    document.head.appendChild(style);
});
