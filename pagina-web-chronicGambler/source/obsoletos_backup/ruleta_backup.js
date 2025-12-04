// =============================================
// SISTEMA DE RULETA FUNCIONAL
// =============================================

class RouletteGame {
    constructor() {
        this.balance = 19485948;
        this.currentBets = {};
        this.gameHistory = [];
        this.isSpinning = false;
        this.betTimer = null;
        this.timeLeft = 45;
        
        // Números rojos y negros de la ruleta europea
        this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        this.blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
        
        // Historial de números recientes
        this.recentNumbers = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startBetTimer();
        this.updateDisplay();
        this.addBetInputs();
        this.addRecentNumberClickListeners();
        
        // Debug: Verificar consistencia de colores
        setTimeout(() => {
            this.debugColorConsistency();
        }, 1000);
    }

    // =============================================
    // SISTEMA DE APUESTAS
    // =============================================
    
    addBetInputs() {
        // Agregar inputs de apuesta a cada celda
        const celdas = document.querySelectorAll('.celda, .celda-externa');
        celdas.forEach(celda => {
            // Crear contenedor para la apuesta
            const betContainer = document.createElement('div');
            betContainer.className = 'bet-container';
            betContainer.innerHTML = `
                <div class="bet-amount">$0</div>
                <input type="number" class="bet-input" placeholder="$" min="0" max="${this.balance}" style="display: none;">
            `;
            celda.appendChild(betContainer);
        });
    }

    setupEventListeners() {
        // Listeners para celdas de números individuales
        document.querySelectorAll('.celda').forEach((celda, index) => {
            celda.addEventListener('click', () => {
                if (!this.isSpinning) {
                    const number = this.getCellNumber(celda);
                    this.handleBet(celda, 'number', number);
                }
            });
        });

        // Listeners para apuestas externas
        document.querySelectorAll('.celda-externa').forEach(celda => {
            celda.addEventListener('click', () => {
                if (!this.isSpinning) {
                    const betType = this.getExternalBetType(celda);
                    this.handleBet(celda, 'external', betType);
                }
            });
        });

        // Listener para el botón de girar (lo agregaremos)
        this.addSpinButton();
    }

    getCellNumber(celda) {
        if (celda.classList.contains('celda-0')) return 0;
        return parseInt(celda.textContent);
    }

    getExternalBetType(celda) {
        if (celda.classList.contains('docena1')) return '1st-dozen';
        if (celda.classList.contains('docena2')) return '2nd-dozen';
        if (celda.classList.contains('docena3')) return '3rd-dozen';
        if (celda.classList.contains('mitad1')) return '1-18';
        if (celda.classList.contains('mitad2')) return '19-36';
        if (celda.classList.contains('par')) return 'even';
        if (celda.classList.contains('impar')) return 'odd';
        if (celda.classList.contains('rojo')) return 'red';
        if (celda.classList.contains('negro')) return 'black';
        return 'unknown';
    }

    handleBet(element, betCategory, betValue) {
        const betKey = `${betCategory}-${betValue}`;
        const betInput = element.querySelector('.bet-input');
        const betAmount = element.querySelector('.bet-amount');
        
        // Verificar si ya hay una apuesta
        if (this.currentBets[betKey]) {
            this.showNotification('Ya hay una apuesta en este cuadrado. Retira la apuesta primero.', 'error');
            return;
        }
        
        if (betInput.style.display === 'none') {
            // Mostrar input para apostar
            betInput.style.display = 'block';
            betInput.focus();
            
            // Remover listeners anteriores
            betInput.removeEventListener('keypress', this.handleKeypress);
            betInput.removeEventListener('blur', this.handleBlur);
            
            // Crear funciones bound para poder removerlas después
            this.handleKeypress = (e) => {
                if (e.key === 'Enter') {
                    this.placeBet(element, betCategory, betValue, parseInt(betInput.value) || 0);
                }
            };
            
            this.handleBlur = () => {
                if (betInput.value) {
                    this.placeBet(element, betCategory, betValue, parseInt(betInput.value) || 0);
                } else {
                    betInput.style.display = 'none';
                }
            };
            
            betInput.addEventListener('keypress', this.handleKeypress);
            betInput.addEventListener('blur', this.handleBlur);
        }
    }

    placeBet(element, betCategory, betValue, amount) {
        if (amount > 0 && amount <= this.balance) {
            const betKey = `${betCategory}-${betValue}`;
            
            // Verificar si ya hay una apuesta en este cuadrado
            if (this.currentBets[betKey]) {
                this.showNotification('Ya hay una apuesta en este cuadrado', 'error');
                const betInput = element.querySelector('.bet-input');
                betInput.style.display = 'none';
                betInput.value = '';
                return;
            }
            
            // Crear nueva apuesta
            this.currentBets[betKey] = { amount: amount, element: element };
            this.balance -= amount;
            
            // Actualizar display
            const betAmount = element.querySelector('.bet-amount');
            const betInput = element.querySelector('.bet-input');
            
            betAmount.textContent = `$${amount}`;
            betAmount.style.display = 'block';
            betInput.style.display = 'none';
            betInput.value = '';
            
            // Añadir clase visual
            element.classList.add('bet-placed');
            
            this.updateBalance();
            this.showNotification(`Apuesta de $${amount} colocada en ${this.getBetDisplayName(betCategory, betValue)}`);
        } else {
            this.showNotification('Monto inválido o saldo insuficiente', 'error');
        }
    }

    getBetDisplayName(category, value) {
        if (category === 'number') return `Número ${value}`;
        
        const names = {
            '1st-dozen': '1ra Docena',
            '2nd-dozen': '2da Docena', 
            '3rd-dozen': '3ra Docena',
            '1-18': '1-18',
            '19-36': '19-36',
            'even': 'Par',
            'odd': 'Impar',
            'red': 'Rojo',
            'black': 'Negro'
        };
        return names[value] || value;
    }

    // =============================================
    // SISTEMA DE GIRO
    // =============================================

    addSpinButton() {
        // Buscar el botón existente en el HTML
        const spinButton = document.getElementById('spin-button');
        if (spinButton) {
            // Agregar event listener al botón existente
            spinButton.onclick = () => this.spinRoulette();
            console.log('✅ Botón de girar conectado correctamente');
        } else {
            console.error('❌ No se encontró el botón de girar en el HTML');
        }
    }

    async spinRoulette() {
        if (this.isSpinning || Object.keys(this.currentBets).length === 0) {
            if (Object.keys(this.currentBets).length === 0) {
                this.showNotification('Debes realizar al menos una apuesta', 'error');
            }
            return;
        }

        this.isSpinning = true;
        this.stopBetTimer();
        
        const spinButton = document.getElementById('spin-button');
        const ruletaImg = document.querySelector('.ruleta-img');
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        
        spinButton.disabled = true;
        spinButton.textContent = '🌀 GIRANDO...';
        statusText.textContent = 'Girando la ruleta...';
        statusIndicator.classList.add('spinning');
        
        // Sonido de giro (simulado con vibración en móviles)
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Animación de la ruleta más realista
        const totalRotation = 1800 + Math.random() * 1800;
        ruletaImg.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        ruletaImg.style.transform = `rotate(${totalRotation}deg)`;
        
        // Efecto de desaceleración visual
        setTimeout(() => {
            statusText.textContent = 'Desacelerando...';
        }, 2000);
        
        // Generar número ganador después de la animación
        setTimeout(() => {
            const winningNumber = this.generateWinningNumber();
            statusText.textContent = `¡Número ganador: ${winningNumber}!`;
            statusIndicator.classList.remove('spinning');
            
            // Efecto de vibración para el resultado
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            }
            
            this.processResults(winningNumber);
            
            // Reset para próxima ronda después de mostrar resultados
            setTimeout(() => {
                this.resetRound();
                this.startBetTimer();
            }, 5000);
        }, 4000);
    }

    generateWinningNumber() {
        return Math.floor(Math.random() * 37); // 0-36
    }

    // =============================================
    // SISTEMA DE RESULTADOS
    // =============================================

    processResults(winningNumber) {
        let totalWinnings = 0;
        const results = [];

        // Mostrar bolita en el número ganador
        this.showWinningBall(winningNumber);
        this.showWinningBallOnRoulette(winningNumber);

        // Procesar cada apuesta
        Object.keys(this.currentBets).forEach(betKey => {
            const bet = this.currentBets[betKey];
            const [category, value] = betKey.split('-');
            const winAmount = this.calculateWinnings(category, value, winningNumber, bet.amount);
            
            if (winAmount > 0) {
                totalWinnings += winAmount;
                results.push({
                    type: this.getBetDisplayName(category, value),
                    amount: bet.amount,
                    result: 'Ganado',
                    variation: winAmount - bet.amount
                });
                
                // Efecto visual de ganancia
                bet.element.classList.add('winning-bet');
            } else {
                results.push({
                    type: this.getBetDisplayName(category, value),
                    amount: bet.amount,
                    result: 'Perdido',
                    variation: -bet.amount
                });
                
                // Efecto visual de pérdida
                bet.element.classList.add('losing-bet');
            }
        });

        this.balance += totalWinnings;
        this.updateGameHistory(results);
        this.updateRecentNumbers(winningNumber);
        this.updateDisplay();
        
        // Mostrar resultados con un pequeño delay para mejor experiencia
        setTimeout(() => {
            this.showResults(winningNumber, totalWinnings);
        }, 1000);
    }

    calculateWinnings(category, value, winningNumber, betAmount) {
        if (category === 'number') {
            return parseInt(value) === winningNumber ? betAmount * 36 : 0;
        }
        
        // Apuestas externas
        switch (value) {
            case 'red':
                return (winningNumber !== 0 && this.redNumbers.includes(winningNumber)) ? betAmount * 2 : 0;
            case 'black':
                return (winningNumber !== 0 && this.blackNumbers.includes(winningNumber)) ? betAmount * 2 : 0;
            case 'even':
                return (winningNumber !== 0 && winningNumber % 2 === 0) ? betAmount * 2 : 0;
            case 'odd':
                return (winningNumber !== 0 && winningNumber % 2 === 1) ? betAmount * 2 : 0;
            case '1-18':
                return (winningNumber >= 1 && winningNumber <= 18) ? betAmount * 2 : 0;
            case '19-36':
                return (winningNumber >= 19 && winningNumber <= 36) ? betAmount * 2 : 0;
            case '1st-dozen':
                return (winningNumber >= 1 && winningNumber <= 12) ? betAmount * 3 : 0;
            case '2nd-dozen':
                return (winningNumber >= 13 && winningNumber <= 24) ? betAmount * 3 : 0;
            case '3rd-dozen':
                return (winningNumber >= 25 && winningNumber <= 36) ? betAmount * 3 : 0;
            default:
                return 0;
        }
    }

    // =============================================
    // SISTEMA DE TIMER Y UI
    // =============================================

    startBetTimer() {
        this.updateTimer();
        this.betTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                if (Object.keys(this.currentBets).length > 0) {
                    this.spinRoulette();
                } else {
                    this.resetTimer();
                }
            }
        }, 1000);
    }

    stopBetTimer() {
        if (this.betTimer) {
            clearInterval(this.betTimer);
            this.betTimer = null;
        }
    }

    updateTimer() {
        const timerDisplay = document.querySelector('.countdown-timer');
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.timeLeft <= 10) {
            timerDisplay.classList.add('critical');
        } else {
            timerDisplay.classList.remove('critical');
        }
    }

    resetTimer() {
        this.timeLeft = 45;
        const timerDisplay = document.querySelector('.countdown-timer');
        timerDisplay.classList.remove('critical');
    }

    resetRound() {
        // Limpiar apuestas
        this.currentBets = {};
        
        // Limpiar efectos visuales
        document.querySelectorAll('.celda, .celda-externa').forEach(element => {
            element.classList.remove('bet-placed', 'winning-bet', 'losing-bet', 'winning-cell');
            const betAmount = element.querySelector('.bet-amount');
            if (betAmount) {
                betAmount.textContent = '$0';
                betAmount.style.display = 'none';
            }
        });
        
        // Remover bolita ganadora de la mesa
        const existingBall = document.querySelector('.winning-ball');
        if (existingBall) {
            existingBall.remove();
        }
        
        // Remover bolita ganadora de la ruleta principal
        const existingRouletteBall = document.querySelector('.roulette-winning-ball');
        if (existingRouletteBall) {
            existingRouletteBall.remove();
        }
        
        // Resetear botón y estado
        const spinButton = document.getElementById('spin-button');
        const ruletaImg = document.querySelector('.ruleta-img');
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        
        spinButton.disabled = false;
        spinButton.textContent = '🎰 GIRAR RULETA';
        ruletaImg.style.transform = 'rotate(0deg)';
        ruletaImg.style.transition = 'transform 1s ease-out';
        statusText.textContent = 'Recibiendo apuestas...';
        statusIndicator.classList.remove('spinning');
        
        // Reiniciar el estado del juego
        this.isSpinning = false;
        
        // Asegurarse de que el timer esté limpio
        this.stopBetTimer();
        this.resetTimer();
    }

    // =============================================
    // SISTEMA DE DISPLAY Y NOTIFICACIONES
    // =============================================

    updateBalance() {
        const saldoAmount = document.querySelector('.saldo-amount');
        saldoAmount.innerHTML = `$${this.balance.toLocaleString()} <span class="currency">CLP</span>`;
    }

    updateGameHistory(results) {
        this.gameHistory = results.concat(this.gameHistory).slice(0, 5);
        this.updateHistoryTable();
    }

    updateHistoryTable() {
        const tbody = document.querySelector('.tabla-apuestas tbody');
        tbody.innerHTML = this.gameHistory.map(result => `
            <tr>
                <td>${result.type}</td>
                <td>$${result.amount}</td>
                <td>${result.result}</td>
                <td class="${result.variation > 0 ? 'ganado' : 'perdido'}">
                    ${result.variation > 0 ? '+' : ''}${result.variation}
                </td>
            </tr>
        `).join('');
    }

    updateRecentNumbers(newNumber) {
        // Crear objeto con más información del número ganador
        const numberInfo = {
            number: newNumber,
            color: this.getNumberColor(newNumber),
            timestamp: new Date(),
            isEven: newNumber !== 0 && newNumber % 2 === 0,
            isHigh: newNumber > 18 && newNumber !== 0,
            dozen: this.getDozen(newNumber)
        };

        this.recentNumbers.unshift(numberInfo);
        this.recentNumbers = this.recentNumbers.slice(0, 5);
        
        // Actualizar display de números recientes con nueva información
        this.updateRecentNumbersDisplay();
    }

    updateRecentNumbersDisplay() {
        const circles = document.querySelectorAll('.tabla-recientes-wrapper .circle-red, .tabla-recientes-wrapper .circle-black, .tabla-recientes-wrapper .circle-green');
        
        circles.forEach((circle, index) => {
            if (index < this.recentNumbers.length) {
                const numberInfo = this.recentNumbers[index];
                const numberElement = circle.querySelector('.circle-number');
                
                // Actualizar número
                numberElement.textContent = numberInfo.number;
                
                // Actualizar color del círculo
                circle.className = `circle-${numberInfo.color}`;
                
                // Agregar información adicional como tooltip
                const additionalInfo = this.getNumberAdditionalInfo(numberInfo);
                circle.title = additionalInfo;
                
                // Agregar clase para números recientes (más destacados)
                if (index === 0) {
                    circle.classList.add('latest-number');
                } else {
                    circle.classList.remove('latest-number');
                }
            } else {
                // Limpiar círculos vacíos
                const numberElement = circle.querySelector('.circle-number');
                if (numberElement) {
                    numberElement.textContent = '-';
                    circle.className = 'circle-empty';
                    circle.title = 'Sin resultado';
                }
            }
        });
    }

    getDozen(number) {
        if (number === 0) return 'Verde';
        if (number >= 1 && number <= 12) return '1ra';
        if (number >= 13 && number <= 24) return '2da';
        if (number >= 25 && number <= 36) return '3ra';
        return 'N/A';
    }

    getNumberAdditionalInfo(numberInfo) {
        const { number, color, isEven, isHigh, dozen, timestamp } = numberInfo;
        const time = timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });

        let info = `Número: ${number}\n`;
        info += `Color: ${color === 'red' ? 'Rojo' : color === 'black' ? 'Negro' : 'Verde'}\n`;
        
        if (number !== 0) {
            info += `Par/Impar: ${isEven ? 'Par' : 'Impar'}\n`;
            info += `Alto/Bajo: ${isHigh ? 'Alto (19-36)' : 'Bajo (1-18)'}\n`;
            info += `Docena: ${dozen}\n`;
        }
        
        info += `Hora: ${time}`;
        
        return info;
    }

    showResults(winningNumber, totalWinnings) {
        const alert = document.querySelector('.alert');
        const winningNumberSpan = alert.querySelector('.winning-number');
        
        winningNumberSpan.textContent = winningNumber;
        
        if (totalWinnings > 0) {
            alert.className = 'alert alert-success d-flex align-items-center justify-content-center';
            alert.innerHTML = `
                <span class="alert-icon me-2">🎉</span>
                <div>
                    <strong>¡Felicidades!</strong> La ruleta marcó el <span class="winning-number">${winningNumber}</span>. 
                    Has ganado $${totalWinnings.toLocaleString()}!
                </div>
            `;
        } else {
            alert.className = 'alert alert-warning d-flex align-items-center justify-content-center';
            alert.innerHTML = `
                <span class="alert-icon me-2">😔</span>
                <div>
                    La ruleta marcó el <span class="winning-number">${winningNumber}</span>. 
                    ¡Mejor suerte en la próxima ronda!
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showWinningBall(winningNumber) {
        // Remover bolita anterior si existe
        const existingBall = document.querySelector('.winning-ball');
        if (existingBall) {
            existingBall.remove();
        }

        // Remover efectos anteriores
        const previousWinningCell = document.querySelector('.winning-cell');
        if (previousWinningCell) {
            previousWinningCell.classList.remove('winning-cell');
        }

        // Encontrar la celda del número ganador
        let winningCell = this.findWinningCell(winningNumber);

        if (winningCell) {
            // Crear la bolita con mejor diseño
            const ball = document.createElement('div');
            ball.className = 'winning-ball';
            
            // Posicionar la bolita en el centro de la celda
            const rect = winningCell.getBoundingClientRect();
            const containerRect = winningCell.offsetParent.getBoundingClientRect();
            
            ball.style.left = `${winningCell.offsetLeft + winningCell.offsetWidth / 2 - 10}px`;
            ball.style.top = `${winningCell.offsetTop + winningCell.offsetHeight / 2 - 10}px`;
            
            // Agregar al contenedor de la tabla
            winningCell.offsetParent.appendChild(ball);
            
            // Efecto especial en la celda ganadora
            winningCell.classList.add('winning-cell');
            
            // Sonido de victoria simulado con vibración
            if (navigator.vibrate) {
                navigator.vibrate([100, 100, 100]);
            }
        }
    }

    showWinningBallOnRoulette(winningNumber) {
        // Remover bolita anterior en la ruleta principal
        const existingRouletteBall = document.querySelector('.roulette-winning-ball');
        if (existingRouletteBall) {
            existingRouletteBall.remove();
        }

        // Obtener la imagen de la ruleta
        const rouletteImg = document.querySelector('.ruleta-img');
        if (!rouletteImg) return;

        // Crear contenedor relativo para la bolita si no existe
        let rouletteContainer = rouletteImg.parentElement;
        if (!rouletteContainer.classList.contains('roulette-container')) {
            const container = document.createElement('div');
            container.className = 'roulette-container';
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            
            rouletteImg.parentElement.insertBefore(container, rouletteImg);
            container.appendChild(rouletteImg);
            rouletteContainer = container;
        }

        // Crear la bolita ganadora en la ruleta
        const rouletteBall = document.createElement('div');
        rouletteBall.className = 'roulette-winning-ball';
        
        // Posiciones específicas para cada número basadas en la imagen real de la ruleta
        // Estas coordenadas están calibradas para la imagen ruleta.png específica
        const position = this.getRoulettePosition(winningNumber);
        
        // Log para debug
        console.log(`🎲 Posicionando bolita en número ${winningNumber} en coordenadas (${position.x}%, ${position.y}%)`);
        
        // Establecer posición de la bolita
        rouletteBall.style.left = `${position.x}%`;
        rouletteBall.style.top = `${position.y}%`;
        
        // Agregar número y color a la bolita
        const numberColor = this.getNumberColor(winningNumber);
        const colorClass = numberColor === 'red' ? 'ball-red' : 
                          numberColor === 'black' ? 'ball-black' : 'ball-green';
        
        rouletteBall.innerHTML = `<span class="ball-number ${colorClass}">${winningNumber}</span>`;
        
        // Agregar al contenedor de la ruleta
        rouletteContainer.appendChild(rouletteBall);
        
        // Animación de aparición
        setTimeout(() => {
            rouletteBall.classList.add('ball-appear');
        }, 500);
    }

    addRecentNumberClickListeners() {
        // Agregar event listeners a los círculos de números recientes
        const circles = document.querySelectorAll('.tabla-recientes-wrapper .circle-red, .tabla-recientes-wrapper .circle-black, .tabla-recientes-wrapper .circle-green, .tabla-recientes-wrapper .circle-empty');
        
        circles.forEach((circle, index) => {
            circle.style.cursor = 'pointer';
            circle.addEventListener('click', () => {
                if (index < this.recentNumbers.length) {
                    const numberInfo = this.recentNumbers[index];
                    this.showNumberDetails(numberInfo);
                }
            });
        });
    }

    showNumberDetails(numberInfo) {
        const { number, color, isEven, isHigh, dozen, timestamp } = numberInfo;
        const time = timestamp.toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });

        const colorName = color === 'red' ? 'Rojo' : 
                         color === 'black' ? 'Negro' : 'Verde';
        
        const colorClass = color === 'red' ? 'text-danger' : 
                          color === 'black' ? 'text-dark' : 'text-success';

        let detailsHTML = `
            <div class="number-details">
                <h4>🎯 Detalles del Número</h4>
                <div class="detail-number ${colorClass}">${number}</div>
                <div class="detail-info">
                    <div class="detail-row">
                        <strong>Color:</strong> 
                        <span class="${colorClass}">${colorName}</span>
                    </div>
                    ${number !== 0 ? `
                        <div class="detail-row">
                            <strong>Tipo:</strong> 
                            ${isEven ? 'Par' : 'Impar'}
                        </div>
                        <div class="detail-row">
                            <strong>Rango:</strong> 
                            ${isHigh ? 'Alto (19-36)' : 'Bajo (1-18)'}
                        </div>
                        <div class="detail-row">
                            <strong>Docena:</strong> 
                            ${dozen} Docena
                        </div>
                    ` : `
                        <div class="detail-row">
                            <strong>Tipo:</strong> 
                            Número especial (Verde)
                        </div>
                    `}
                    <div class="detail-row">
                        <strong>Hora:</strong> 
                        ${time}
                    </div>
                </div>
                <div class="winning-combinations">
                    <h6>🏆 Apuestas Ganadoras para este número:</h6>
                    <ul>
                        <li>Número directo (${number}) - Pago 35:1</li>
                        ${number !== 0 ? `
                            <li>Color ${colorName} - Pago 1:1</li>
                            <li>${isEven ? 'Par' : 'Impar'} - Pago 1:1</li>
                            <li>${isHigh ? 'Alto (19-36)' : 'Bajo (1-18)'} - Pago 1:1</li>
                            <li>${dozen} Docena - Pago 2:1</li>
                        ` : ''}
                    </ul>
                </div>
            </div>
        `;

        this.showHistoryModal(detailsHTML);
    }

    showDetailedHistory() {
        if (this.recentNumbers.length === 0) {
            this.showNotification('No hay números en el historial aún', 'info');
            return;
        }

        let historyHTML = '<div class="detailed-history"><h4>🎲 Historial Detallado de Números</h4>';
        
        this.recentNumbers.forEach((numberInfo, index) => {
            const { number, color, isEven, isHigh, dozen, timestamp } = numberInfo;
            const time = timestamp.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const colorClass = color === 'red' ? 'text-danger' : 
                              color === 'black' ? 'text-dark' : 'text-success';
            
            historyHTML += `
                <div class="history-item ${index === 0 ? 'latest' : ''}">
                    <div class="history-number ${colorClass}">${number}</div>
                    <div class="history-details">
                        <div class="history-time">${time}</div>
                        ${number !== 0 ? `
                            <div class="history-props">
                                ${isEven ? 'Par' : 'Impar'} • 
                                ${isHigh ? 'Alto' : 'Bajo'} • 
                                ${dozen} Docena
                            </div>
                        ` : '<div class="history-props">Verde - Especial</div>'}
                    </div>
                </div>
            `;
        });
        
        historyHTML += '</div>';
        
        // Crear modal temporal para mostrar el historial
        this.showHistoryModal(historyHTML);
    }

    showHistoryModal(content) {
        // Remover modal anterior si existe
        const existingModal = document.querySelector('.history-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'history-modal';
        modal.innerHTML = `
            <div class="history-modal-content">
                <button class="history-close-btn">&times;</button>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);

        // Event listener para cerrar
        modal.querySelector('.history-close-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getNumberColor(number) {
        if (number === 0) return 'green';
        return this.redNumbers.includes(number) ? 'red' : 'black';
    }

    debugColorConsistency() {
        console.log('🎯 Verificando consistencia de colores...');
        
        // Verificar que todos los números tengan el color correcto en HTML
        for (let i = 1; i <= 36; i++) {
            const isRedInJS = this.redNumbers.includes(i);
            const celda = document.querySelector(`.celda:not(.celda-0)`);
            const celdas = document.querySelectorAll('.celda:not(.celda-0)');
            
            let celdaNumber = null;
            celdas.forEach(celda => {
                if (parseInt(celda.textContent) === i) {
                    celdaNumber = celda;
                }
            });
            
            if (celdaNumber) {
                const hasRedClass = celdaNumber.classList.contains('celda-rojo');
                const hasBlackClass = celdaNumber.classList.contains('celda-negro');
                
                if (isRedInJS && !hasRedClass) {
                    console.warn(`❌ Número ${i} debería ser ROJO en HTML`);
                } else if (!isRedInJS && i !== 0 && !hasBlackClass) {
                    console.warn(`❌ Número ${i} debería ser NEGRO en HTML`);
                } else if ((isRedInJS && hasRedClass) || (!isRedInJS && hasBlackClass)) {
                    console.log(`✅ Número ${i} color correcto`);
                }
            }
        }
    }

    verifyRouletteSetup() {
        console.log('🎰 VERIFICACIÓN COMPLETA DE LA RULETA');
        console.log('=====================================');
        
        // Verificar que todos los números del 0-36 estén presentes
        const allNumbers = [];
        const celdas = document.querySelectorAll('.celda');
        
        celdas.forEach(celda => {
            const number = parseInt(celda.textContent);
            if (!isNaN(number)) {
                allNumbers.push(number);
            }
        });
        
        allNumbers.sort((a, b) => a - b);
        console.log('📋 Números encontrados:', allNumbers);
        
        // Verificar que estén todos los números del 0-36
        const missingNumbers = [];
        for (let i = 0; i <= 36; i++) {
            if (!allNumbers.includes(i)) {
                missingNumbers.push(i);
            }
        }
        
        if (missingNumbers.length > 0) {
            console.error('❌ Números faltantes:', missingNumbers);
        } else {
            console.log('✅ Todos los números 0-36 están presentes');
        }
        
        // Verificar colores
        let correctColors = 0;
        let incorrectColors = 0;
        
        for (let i = 0; i <= 36; i++) {
            const expectedColor = this.getNumberColor(i);
            const cell = this.findWinningCell(i);
            
            if (cell) {
                let actualColor;
                if (i === 0) {
                    actualColor = cell.classList.contains('celda-0') ? 'green' : 'unknown';
                } else {
                    actualColor = cell.classList.contains('celda-rojo') ? 'red' : 'black';
                }
                
                if (expectedColor === actualColor) {
                    correctColors++;
                } else {
                    incorrectColors++;
                    console.error(`❌ Número ${i}: esperado=${expectedColor}, actual=${actualColor}`);
                }
            }
        }
        
        console.log(`🎨 Colores correctos: ${correctColors}/37`);
        console.log(`🎨 Colores incorrectos: ${incorrectColors}/37`);
        
        if (incorrectColors === 0) {
            console.log('🎉 ¡TODOS LOS COLORES SON CORRECTOS!');
        }
        
        return { correctColors, incorrectColors, missingNumbers };
    }

    testBallPositioning() {
        console.log('🎯 INICIANDO PRUEBA DE POSICIONAMIENTO MEJORADO');
        console.log('==============================================');
        
        // Probar números específicos conocidos por su posición
        const testCases = [
            { number: 0, description: 'Verde (parte superior)' },
            { number: 32, description: 'Primer número después del 0' },
            { number: 17, description: 'Parte inferior' },
            { number: 36, description: 'Lado izquierdo' },
            { number: 10, description: 'Lado derecho' },
            { number: 1, description: 'Rojo del lado izquierdo' },
            { number: 2, description: 'Negro del lado derecho superior' },
            { number: 11, description: 'Negro problemático (antes rojo)' },
            { number: 29, description: 'Negro problemático (antes rojo)' }
        ];

        console.log('📍 Probando casos específicos...');
        testCases.forEach((testCase, index) => {
            setTimeout(() => {
                console.log(`🔍 Caso ${index + 1}: ${testCase.description} (${testCase.number})`);
                this.forceWinningNumber(testCase.number);
            }, index * 2500);
        });

        // Agregar comando para probar todos los números
        setTimeout(() => {
            console.log('');
            console.log('🎲 Para probar todos los números secuencialmente, ejecuta:');
            console.log('   testSequence(0, 36, 1500)');
            console.log('');
            console.log('🔧 Para calibrar manualmente, ejecuta:');
            console.log('   calibrateRoulette()');
        }, testCases.length * 2500 + 1000);
    }

    // Función para verificar distribución de colores
    verifyColorDistribution() {
        console.log('🎨 VERIFICANDO DISTRIBUCIÓN DE COLORES');
        console.log('=====================================');
        
        const verification = {
            red: [],
            black: [],
            green: [0]
        };

        // Clasificar números por color
        for (let i = 1; i <= 36; i++) {
            const color = this.getNumberColor(i);
            if (color === 'red') {
                verification.red.push(i);
            } else if (color === 'black') {
                verification.black.push(i);
            }
        }

        console.log(`🔴 Números rojos (${verification.red.length}):`, verification.red.join(', '));
        console.log(`⚫ Números negros (${verification.black.length}):`, verification.black.length);
        console.log(`🟢 Números verdes (${verification.green.length}):`, verification.green.join(', '));
        
        // Verificar que tenemos exactamente 18 rojos y 18 negros
        if (verification.red.length === 18 && verification.black.length === 18) {
            console.log('✅ Distribución de colores correcta');
        } else {
            console.error('❌ Error en distribución de colores');
        }

        return verification;
    }

    // Función para mostrar el orden real de la ruleta europea
    showRouletteOrder() {
        console.log('🎯 ORDEN DE NÚMEROS EN RULETA EUROPEA');
        console.log('====================================');
        
        const rouletteOrder = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
        
        console.log('Orden desde el 0 (sentido horario):');
        rouletteOrder.forEach((num, index) => {
            const color = this.getNumberColor(num);
            const colorSymbol = color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢';
            console.log(`${index + 1}. ${colorSymbol} ${num}`);
        });

        return rouletteOrder;
    }

    // Función de prueba para números específicos
    testSpecificNumbers() {
        console.log('🔬 Iniciando pruebas de números específicos...');
        
        // Probar algunos números conocidos
        const testNumbers = [1, 2, 11, 12, 18, 19, 29, 30];
        
        testNumbers.forEach(num => {
            const expectedColor = this.getNumberColor(num);
            const cell = this.findWinningCell(num);
            
            if (cell) {
                const actualColorClass = cell.classList.contains('celda-rojo') ? 'red' : 'black';
                const match = expectedColor === actualColorClass;
                
                console.log(`Número ${num}: esperado=${expectedColor}, actual=${actualColorClass}, ✅${match ? 'CORRECTO' : '❌INCORRECTO'}`);
                
                if (!match) {
                    console.error(`💥 PROBLEMA: Número ${num} tiene color incorrecto en HTML`);
                }
            }
        });
    }

    // Función para forzar un número específico (solo para pruebas)
    forceWinningNumber(number) {
        console.log(`🎯 Forzando número ganador: ${number}`);
        
        this.processResults(number);
        
        setTimeout(() => {
            this.resetRound();
            this.startBetTimer();
        }, 3000);
    }

    // =============================================
    // SISTEMA DE CALIBRACIÓN ASISTIDA
    // =============================================

    startQuickCalibration() {
        console.log('🎯 INICIANDO CALIBRACIÓN RÁPIDA');
        console.log('================================');
        
        // Coordenadas mejoradas basadas en análisis de ruleta europea estándar
        const improvedPositions = {
            // Verde (0) - arriba
            0: { x: 50, y: 8 },
            
            // Lado derecho (empezando desde arriba, sentido horario)
            32: { x: 71, y: 14 },  // Después del 0
            15: { x: 85, y: 25 },
            19: { x: 92, y: 40 },
            4: { x: 92, y: 58 },
            21: { x: 85, y: 73 },
            2: { x: 71, y: 84 },
            
            // Parte inferior
            25: { x: 58, y: 91 },
            17: { x: 50, y: 92 },  // Abajo centro
            34: { x: 42, y: 91 },
            
            // Lado izquierdo (continuando sentido horario)
            6: { x: 29, y: 84 },
            27: { x: 15, y: 73 },
            13: { x: 8, y: 58 },
            36: { x: 8, y: 40 },
            11: { x: 15, y: 25 },
            30: { x: 29, y: 14 },
            
            // Círculo interior (más hacia el centro)
            8: { x: 62, y: 22 },
            23: { x: 76, y: 32 },
            10: { x: 82, y: 47 },
            5: { x: 76, y: 66 },
            24: { x: 62, y: 76 },
            16: { x: 50, y: 78 },
            33: { x: 38, y: 76 },
            1: { x: 24, y: 66 },
            20: { x: 18, y: 47 },
            14: { x: 24, y: 32 },
            31: { x: 38, y: 22 },
            9: { x: 50, y: 20 },
            
            // Círculo más interior
            22: { x: 58, y: 30 },
            18: { x: 68, y: 42 },
            29: { x: 68, y: 58 },
            7: { x: 58, y: 70 },
            28: { x: 50, y: 72 },
            12: { x: 42, y: 70 },
            35: { x: 32, y: 58 },
            3: { x: 32, y: 42 },
            26: { x: 42, y: 30 }
        };

        this.tempPositions = improvedPositions;
        console.log('✅ Posiciones mejoradas cargadas');
        
        // Mostrar menú de opciones
        console.log('\n🎮 OPCIONES DE CALIBRACIÓN:');
        console.log('1. quickTest() - Prueba todos los números rápidamente');
        console.log('2. testSpecificNumber(X) - Prueba un número específico');
        console.log('3. adjustNumber(num, x, y) - Ajustar coordenadas manualmente');
        console.log('4. showCalibrationPanel() - Abrir panel visual');
        console.log('5. exportFinalPositions() - Exportar posiciones finales');
        
        // Hacer funciones disponibles globalmente
        window.quickTest = () => this.runQuickTest();
        window.testSpecificNumber = (num) => this.testSingleNumber(num);
        window.adjustNumber = (num, x, y) => this.adjustNumberPosition(num, x, y);
        window.showCalibrationPanel = () => this.createCalibrationInterface();
        window.exportFinalPositions = () => this.exportPositions();
        
        console.log('\n🚀 Ejecuta quickTest() para ver todos los números');
    }

    runQuickTest() {
        console.log('🎲 Ejecutando prueba rápida de todos los números...');
        
        // Probar números en orden de la ruleta para mejor visualización
        const rouletteOrder = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
        
        rouletteOrder.forEach((num, index) => {
            setTimeout(() => {
                const position = this.getRoulettePosition(num);
                console.log(`🎯 Probando ${num} en (${position.x}%, ${position.y}%)`);
                this.forceWinningNumber(num);
            }, index * 1200); // 1.2 segundos entre cada número
        });

        setTimeout(() => {
            console.log('\n✅ Prueba completa terminada');
            console.log('💡 Para ajustar algún número: adjustNumber(numero, x, y)');
            console.log('💡 Para exportar posiciones: exportFinalPositions()');
        }, rouletteOrder.length * 1200 + 2000);
    }

    testSingleNumber(num) {
        if (num < 0 || num > 36) {
            console.error('❌ Número debe estar entre 0 y 36');
            return;
        }
        
        const position = this.getRoulettePosition(num);
        console.log(`🎯 Probando número ${num} en posición (${position.x}%, ${position.y}%)`);
        this.forceWinningNumber(num);
        
        // Mostrar bolita de calibración también
        setTimeout(() => {
            this.showCalibrationBall(num, position.x, position.y);
        }, 2000);
    }

    adjustNumberPosition(num, x, y) {
        if (num < 0 || num > 36) {
            console.error('❌ Número debe estar entre 0 y 36');
            return;
        }
        
        this.tempPositions = this.tempPositions || {};
        this.tempPositions[num] = { x: parseFloat(x), y: parseFloat(y) };
        
        console.log(`📍 Número ${num} ajustado a (${x}%, ${y}%)`);
        
        // Mostrar inmediatamente el resultado
        this.forceWinningNumber(num);
        setTimeout(() => {
            this.showCalibrationBall(num, x, y);
        }, 1000);
    }

    exportPositions() {
        const finalPositions = this.tempPositions || this.getOptimizedPositions();
        
        console.log('💾 POSICIONES FINALES PARA COPIAR EN EL CÓDIGO:');
        console.log('================================================');
        console.log('// Pega esto en la función getRoulettePosition():');
        console.log('const numberPositions = {');
        
        for (let i = 0; i <= 36; i++) {
            const pos = finalPositions[i];
            if (pos) {
                console.log(`    ${i}: { x: ${pos.x}, y: ${pos.y} },`);
            }
        }
        
        console.log('};');
        console.log('\n✅ Copia el código de arriba y pégalo en ruleta.js');
    }

    // Función para calibración visual individual
    calibrateSingleNumber(number) {
        console.log(`🔧 Calibrando número ${number}...`);
        
        // Mostrar posición actual
        const currentPos = this.getRoulettePosition(number);
        console.log(`Posición actual: (${currentPos.x}%, ${currentPos.y}%)`);
        
        // Mostrar controles
        console.log('Usa estos comandos para ajustar:');
        console.log(`adjustNumber(${number}, x, y) - donde x e y son porcentajes (0-100)`);
        console.log('Ejemplos:');
        console.log(`adjustNumber(${number}, ${currentPos.x + 5}, ${currentPos.y}) - Mover 5% a la derecha`);
        console.log(`adjustNumber(${number}, ${currentPos.x}, ${currentPos.y - 5}) - Mover 5% hacia arriba`);
        
        // Mostrar número en posición actual
        this.testSingleNumber(number);
    }

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================

    findWinningCell(winningNumber) {
        // Buscar la celda correspondiente al número ganador
        if (winningNumber === 0) {
            return document.querySelector('.celda-0');
        }
        
        // Para números del 1-36, buscar por contenido de texto
        const celdas = document.querySelectorAll('.celda:not(.celda-0)');
        for (let celda of celdas) {
            if (parseInt(celda.textContent) === winningNumber) {
                console.log(`✅ Encontrada celda para número ${winningNumber}:`, celda);
                
                return celda;
            }
        }
        
        console.error(`❌ No se encontró celda para número ${winningNumber}`);
        return null;
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

// Esperar a que la página cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    window.rouletteGame = new RouletteGame();
    console.log('🎰 Sistema de Ruleta inicializado correctamente');
    
    // Funciones de debug disponibles en consola
    window.testColors = () => window.rouletteGame.debugColorConsistency();
    window.testSpecific = () => window.rouletteGame.testSpecificNumbers();
    window.forceNumber = (num) => window.rouletteGame.forceWinningNumber(num);
    window.verifyRoulette = () => window.rouletteGame.verifyRouletteSetup();
    window.testBall = () => window.rouletteGame.testBallPositioning();
    window.calibrateRoulette = () => window.rouletteGame.calibrateRoulettePositions();
    window.verifyColors = () => window.rouletteGame.verifyColorDistribution();
    window.showOrder = () => window.rouletteGame.showRouletteOrder();
    
    // NUEVO SISTEMA DE CALIBRACIÓN ASISTIDA
    window.startCalibration = () => window.rouletteGame.startQuickCalibration();
    window.calibrateSingle = (num) => window.rouletteGame.calibrateSingleNumber(num);
    
    window.testSequence = (start = 0, end = 36, delay = 1500) => {
        for (let i = start; i <= end; i++) {
            setTimeout(() => {
                console.log(`Probando número ${i}`);
                window.rouletteGame.forceWinningNumber(i);
            }, (i - start) * delay);
        }
    };
    
    console.log('🎯 SISTEMA DE CALIBRACIÓN DE BOLITA DISPONIBLE:');
    console.log('===============================================');
    console.log('✨ COMANDO PRINCIPAL: startCalibration()');
    console.log('');
    console.log('📋 Otros comandos útiles:');
    console.log('   - forceNumber(X) - Fuerza el número X como ganador');
    console.log('   - calibrateSingle(X) - Calibra solo el número X');
    console.log('   - testBall() - Prueba de posicionamiento general');
    console.log('   - verifyColors() - Verifica colores de números');
    console.log('');
    console.log('🚀 Para comenzar, ejecuta: startCalibration()');
});

// Estilos CSS adicionales para las funcionalidades
const additionalStyles = `
    <style>
    .bet-container {
        position: absolute;
        top: -10px;
        right: -10px;
        z-index: 10;
    }
    
    .bet-amount {
        background: rgba(255, 215, 0, 0.9);
        color: #333;
        font-size: 0.7em;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        display: none;
    }
    
    .bet-input {
        width: 60px;
        padding: 2px 4px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.8em;
    }
    
    .bet-placed {
        border: 2px solid #ffd700 !important;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5) !important;
    }
    
    .winning-bet {
        animation: winPulse 1s ease-in-out 3;
    }
    
    .losing-bet {
        animation: losePulse 1s ease-in-out 2;
    }
    
    @keyframes winPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 10px #00ff00; }
        50% { transform: scale(1.1); box-shadow: 0 0 20px #00ff00; }
    }
    
    @keyframes losePulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 10px #ff0000; }
        50% { transform: scale(0.9); box-shadow: 0 0 15px #ff0000; }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    #spin-button {
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: linear-gradient(135deg, #dc3545, #ff6b6b);
        border: none;
        box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
        transition: all 0.3s ease;
    }
    
    #spin-button:hover {
        background: linear-gradient(135deg, #ff6b6b, #dc3545);
        transform: translateY(-2px);
        box-shadow: 0 12px 35px rgba(220, 53, 69, 0.4);
    }
    
    #spin-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    </style>
`;

// Agregar estilos al head cuando se cargue el script
document.addEventListener('DOMContentLoaded', () => {
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
});

// =============================================
// INICIALIZACIÓN
// =============================================

// Esperar a que la página cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    window.rouletteGame = new RouletteGame();
    console.log('🎰 Sistema de Ruleta inicializado correctamente');
    
    // Funciones de debug disponibles en consola
    window.testColors = () => window.rouletteGame.debugColorConsistency();
    window.testSpecific = () => window.rouletteGame.testSpecificNumbers();
    window.forceNumber = (num) => window.rouletteGame.forceWinningNumber(num);
    window.verifyRoulette = () => window.rouletteGame.verifyRouletteSetup();
    window.testBall = () => window.rouletteGame.testBallPositioning();
    window.calibrateRoulette = () => window.rouletteGame.calibrateRoulettePositions();
    window.verifyColors = () => window.rouletteGame.verifyColorDistribution();
    window.showOrder = () => window.rouletteGame.showRouletteOrder();
    
    // NUEVO SISTEMA DE CALIBRACIÓN ASISTIDA
    window.startCalibration = () => window.rouletteGame.startQuickCalibration();
    window.calibrateSingle = (num) => window.rouletteGame.calibrateSingleNumber(num);
    
    window.testSequence = (start = 0, end = 36, delay = 1500) => {
        for (let i = start; i <= end; i++) {
            setTimeout(() => {
                console.log(`Probando número ${i}`);
                window.rouletteGame.forceWinningNumber(i);
            }, (i - start) * delay);
        }
    };
    
    console.log('🎯 SISTEMA DE CALIBRACIÓN DE BOLITA DISPONIBLE:');
    console.log('===============================================');
    console.log('✨ COMANDO PRINCIPAL: startCalibration()');
    console.log('');
    console.log('📋 Otros comandos útiles:');
    console.log('   - forceNumber(X) - Fuerza el número X como ganador');
    console.log('   - calibrateSingle(X) - Calibra solo el número X');
    console.log('   - testBall() - Prueba de posicionamiento general');
    console.log('   - verifyColors() - Verifica colores de números');
    console.log('');
    console.log('🚀 Para comenzar, ejecuta: startCalibration()');
});
