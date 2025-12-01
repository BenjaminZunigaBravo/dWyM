// =============================================
// SISTEMA DE RULETA SIMPLE Y FUNCIONAL
// =============================================

class SimpleRoulette {
    constructor() {
        // Verificar si ya hay una instancia
        if (window.rouletteInstance) {
            console.warn('Ya existe una instancia de ruleta');
            return window.rouletteInstance;
        }
        
        this.balance = 19485948;
        this.currentBets = {};
        this.isSpinning = false;
        this.timeLeft = 45;
        this.timer = null;
        this.recentNumbers = [];
        this.betHistory = []; // Historial de apuestas para la tabla
        
        // Números rojos en ruleta europea
        this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        
        // Guardar referencia
        window.rouletteInstance = this;
        
        this.init();
    }
    
    init() {
        console.log('🎰 Inicializando ruleta simple...');
        
        // Limpiar timers existentes
        this.stopTimer();
        
        this.setupBasicListeners();
        this.startTimer();
        this.updateBalance();
        this.updateRecentNumbers();
        this.initializeBetHistoryTable();
    }
    
    // =============================================
    // LISTENERS BÁSICOS
    // =============================================
    
    setupBasicListeners() {
        // Botón de girar
        const spinButton = document.getElementById('spin-button');
        if (spinButton) {
            spinButton.onclick = () => this.spin();
        }
        
        // Celdas de números
        document.querySelectorAll('.celda').forEach(celda => {
            celda.onclick = () => this.placeBet(celda, this.getNumber(celda));
        });
        
        // Apuestas externas
        document.querySelectorAll('.celda-externa').forEach(celda => {
            celda.onclick = () => this.placeBet(celda, this.getExternalBet(celda));
        });
    }
    
    getNumber(celda) {
        if (celda.classList.contains('celda-0')) return 0;
        return parseInt(celda.textContent);
    }
    
    getExternalBet(celda) {
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
    // SISTEMA DE APUESTAS
    // =============================================
    
    placeBet(element, betType) {
        if (this.isSpinning) {
            this.showMessage('La ruleta está girando, espera al siguiente turno', 'warning');
            return;
        }
        
        const betKey = `bet_${betType}`;
        
        // Si ya hay apuesta, mostrar cantidad
        if (this.currentBets[betKey]) {
            this.showMessage(`Ya apostaste $${this.currentBets[betKey]} en ${this.getBetDisplayName(betType)}`, 'info');
            return;
        }
        
        // Pedir cantidad
        const amount = prompt('¿Cuánto quieres apostar?');
        if (!amount || isNaN(amount) || amount <= 0) return;
        
        const betAmount = parseInt(amount);
        if (betAmount > this.balance) {
            this.showMessage('No tienes suficiente saldo', 'error');
            return;
        }
        
        // Guardar apuesta
        this.currentBets[betKey] = betAmount;
        this.balance -= betAmount;
        this.updateBalance();
        
        // Efecto visual
        element.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        element.innerHTML += `<div style="color: gold; font-weight: bold; margin-top: 5px;">$${betAmount}</div>`;
        
        this.showMessage(`Apostaste $${betAmount} en ${this.getBetDisplayName(betType)}`, 'success');
    }
    
    // =============================================
    // SISTEMA DE GIRO
    // =============================================
    
    spin() {
        if (this.isSpinning) return;
        if (Object.keys(this.currentBets).length === 0) {
            this.showMessage('Debes hacer al menos una apuesta', 'error');
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
        statusText.textContent = 'Girando la ruleta...';
        
        // Animación de giro
        if (rouletteImg) {
            const rotation = 1800 + Math.random() * 1800;
            rouletteImg.style.transition = 'transform 3s ease-out';
            rouletteImg.style.transform = `rotate(${rotation}deg)`;
        }
        
        // Resultado después de 3 segundos
        setTimeout(() => {
            const winningNumber = Math.floor(Math.random() * 37); // 0-36
            this.processResult(winningNumber);
            
            // Resetear después de 3 segundos
            setTimeout(() => {
                this.resetRound();
            }, 3000);
        }, 3000);
    }
    
    // =============================================
    // PROCESAMIENTO DE RESULTADOS
    // =============================================
    
    processResult(winningNumber) {
        const statusText = document.querySelector('.status-text');
        statusText.textContent = `¡Salió el ${winningNumber}!`;
        
        // Mostrar número ganador
        this.showWinningNumber(winningNumber);
        this.showWinningBall(winningNumber);
        
        let totalWinnings = 0;
        const currentRoundResults = [];
        
        // Revisar cada apuesta
        Object.keys(this.currentBets).forEach(betKey => {
            const betAmount = this.currentBets[betKey];
            const betType = betKey.replace('bet_', '');
            const winAmount = this.calculateWinning(betType, winningNumber, betAmount);
            
            // Guardar resultado de esta apuesta
            const betResult = {
                type: this.getBetDisplayName(betType),
                amount: betAmount,
                result: winAmount > 0 ? 'Ganado' : 'Perdido',
                variation: winAmount > 0 ? winAmount - betAmount : -betAmount
            };
            
            currentRoundResults.push(betResult);
            
            if (winAmount > 0) {
                totalWinnings += winAmount;
            }
        });
        
        // Agregar resultados al historial
        currentRoundResults.forEach(result => {
            this.betHistory.unshift(result);
        });
        
        // Mantener solo los últimos 20 resultados
        if (this.betHistory.length > 20) {
            this.betHistory = this.betHistory.slice(0, 20);
        }
        
        // Actualizar balance
        this.balance += totalWinnings;
        this.updateBalance();
        
        // Actualizar tablas
        this.recentNumbers.unshift(winningNumber);
        if (this.recentNumbers.length > 5) this.recentNumbers.pop();
        this.updateRecentNumbers();
        this.updateBetHistoryTable();
        
        if (totalWinnings > 0) {
            this.showMessage(`¡Ganaste un total de $${totalWinnings}!`, 'success');
        } else {
            this.showMessage('No ganaste esta vez, ¡mejor suerte la próxima!', 'info');
        }
    }
    
    calculateWinning(betType, winningNumber, betAmount) {
        // Número directo
        if (typeof betType === 'number') {
            return betType === winningNumber ? betAmount * 36 : 0;
        }
        
        // Apuestas externas
        switch (betType) {
            case 'rojo':
                return this.redNumbers.includes(winningNumber) ? betAmount * 2 : 0;
            case 'negro':
                return !this.redNumbers.includes(winningNumber) && winningNumber !== 0 ? betAmount * 2 : 0;
            case 'par':
                return winningNumber > 0 && winningNumber % 2 === 0 ? betAmount * 2 : 0;
            case 'impar':
                return winningNumber % 2 === 1 ? betAmount * 2 : 0;
            case 'mitad1':
                return winningNumber >= 1 && winningNumber <= 18 ? betAmount * 2 : 0;
            case 'mitad2':
                return winningNumber >= 19 && winningNumber <= 36 ? betAmount * 2 : 0;
            case 'docena1':
                return winningNumber >= 1 && winningNumber <= 12 ? betAmount * 3 : 0;
            case 'docena2':
                return winningNumber >= 13 && winningNumber <= 24 ? betAmount * 3 : 0;
            case 'docena3':
                return winningNumber >= 25 && winningNumber <= 36 ? betAmount * 3 : 0;
            default:
                return 0;
        }
    }
    
    getBetDisplayName(betType) {
        // Si es un número
        if (typeof betType === 'number') {
            return `Número ${betType}`;
        }
        
        // Apuestas externas
        switch (betType) {
            case 'rojo': return 'Rojo';
            case 'negro': return 'Negro';
            case 'par': return 'Par';
            case 'impar': return 'Impar';
            case 'mitad1': return '1-18';
            case 'mitad2': return '19-36';
            case 'docena1': return '1ra Docena';
            case 'docena2': return '2da Docena';
            case 'docena3': return '3ra Docena';
            default: return betType;
        }
    }
    
    // =============================================
    // EFECTOS VISUALES
    // =============================================
    
    showWinningNumber(number) {
        // Actualizar alerta principal
        const winningNumberSpan = document.querySelector('.winning-number');
        if (winningNumberSpan) {
            winningNumberSpan.textContent = number;
        }
    }
    
    showWinningBall(number) {
        // Remover bolas anteriores
        document.querySelectorAll('.winning-ball').forEach(ball => ball.remove());
        
        // Encontrar la celda ganadora
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
    }
    
    showMessage(message, type) {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} d-flex align-items-center justify-content-center`;
            alert.querySelector('div').innerHTML = `<strong>¡${type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Info'}!</strong> ${message}`;
        } else {
            alert(message);
        }
    }
    
    // =============================================
    // ACTUALIZACIÓN DE TABLAS
    // =============================================
    
    initializeBetHistoryTable() {
        const tbody = document.querySelector('.tabla-apuestas tbody');
        if (tbody) {
            // Limpiar tabla y mostrar filas vacías
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
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        // Mostrar los primeros 5 resultados del historial
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
        
        // Si no hay suficientes resultados, llenar con filas vacías
        while (tbody.children.length < 5) {
            const row = document.createElement('tr');
            row.innerHTML = `<td>-</td><td>-</td><td>-</td><td>-</td>`;
            tbody.appendChild(row);
        }
    }
    
    // =============================================
    // SISTEMA DE TIEMPO
    // =============================================
    
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
    
    // =============================================
    // ACTUALIZACIÓN DE INTERFAZ
    // =============================================
    
    updateBalance() {
        const saldoAmount = document.querySelector('.saldo-amount');
        if (saldoAmount) {
            saldoAmount.innerHTML = `$${this.balance.toLocaleString()} <span class="currency">CLP</span>`;
        }
    }
    
    updateRecentNumbers() {
        // Buscar todos los círculos, sin importar su clase actual
        const circleContainers = document.querySelectorAll('.custom-table tbody tr td');
        circleContainers.forEach((container, index) => {
            const circle = container.querySelector('div');
            const numberSpan = container.querySelector('.circle-number');
            
            if (circle && numberSpan) {
                if (this.recentNumbers[index] !== undefined) {
                    const number = this.recentNumbers[index];
                    numberSpan.textContent = number;
                    
                    // Aplicar color correcto
                    if (number === 0) {
                        circle.className = 'circle-green';
                    } else if (this.redNumbers.includes(number)) {
                        circle.className = 'circle-red';
                    } else {
                        circle.className = 'circle-black';
                    }
                } else {
                    numberSpan.textContent = '-';
                    circle.className = 'circle-empty';
                }
            }
        });
    }
    
    // =============================================
    // RESET DE RONDA
    // =============================================
    
    resetRound() {
        this.isSpinning = false;
        this.currentBets = {};
        
        // Resetear botón
        const spinButton = document.getElementById('spin-button');
        spinButton.disabled = false;
        spinButton.textContent = '🎰 GIRAR RULETA';
        
        // Resetear estado
        const statusText = document.querySelector('.status-text');
        statusText.textContent = 'Recibiendo apuestas...';
        
        // Limpiar apuestas visuales
        document.querySelectorAll('.celda, .celda-externa').forEach(celda => {
            celda.style.backgroundColor = '';
            const betDiv = celda.querySelector('div[style*="color: gold"]');
            if (betDiv) betDiv.remove();
        });
        
        // Remover bolas
        document.querySelectorAll('.winning-ball').forEach(ball => ball.remove());
        
        // Reiniciar timer
        this.startTimer();
    }
}

// =============================================
// FUNCIONES DE CALIBRACIÓN SIMPLES
// =============================================

function testBallPosition(number) {
    if (window.simpleRoulette) {
        window.simpleRoulette.showWinningBall(number);
        console.log(`Probando posición de bolita en número ${number}`);
    }
}

function runFullTest() {
    if (!window.simpleRoulette) return;
    
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

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Evitar inicialización duplicada
    if (window.simpleRoulette) {
        console.log('🎰 Ruleta ya inicializada, saltando...');
        return;
    }
    
    window.simpleRoulette = new SimpleRoulette();
    console.log('🎰 Sistema de Ruleta Simple inicializado');
    console.log('Comandos disponibles: testBallPosition(número), runFullTest()');
    
    // Agregar estilos para animación de bolita
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.5); }
        }
        
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
        
        .ganado {
            color: #28a745;
            font-weight: bold;
        }
        
        .perdido {
            color: #dc3545;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
});
