class MinesweeperGame {
    constructor(options) {
        this.boardElem = options.boardElem;
        this.timerElem = options.timerElem;
        this.flagsLeftElem = options.flagsLeftElem;
        this.messageElem = options.messageElem;
        this.victoryAnim = options.victoryAnim;
        this.rankingTable = options.rankingTable;
        this.rowsInput = options.rowsInput;
        this.colsInput = options.colsInput;
        this.minesInput = options.minesInput;

        this.rows = 9;
        this.cols = 9;
        this.mines = 10;
        this.flagsLeft = 10;
        this.revealedCount = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameOver = false;
        this.firstClick = true;
        this.board = [];

        this.init();
    }

    init() {
        this.rowsInput.addEventListener('change', () => this.validateInputs());
        this.colsInput.addEventListener('change', () => this.validateInputs());
        this.minesInput.addEventListener('change', () => this.validateInputs());
        this.validateInputs();
        this.createBoard();
        this.renderRanking();
    }

    validateInputs() {
        this.rows = Math.max(5, Math.min(20, parseInt(this.rowsInput.value)));
        this.cols = Math.max(5, Math.min(20, parseInt(this.colsInput.value)));
        this.mines = Math.max(5, Math.min(this.rows * this.cols - 1, parseInt(this.minesInput.value)));
        this.rowsInput.value = this.rows;
        this.colsInput.value = this.cols;
        this.minesInput.value = this.mines;
    }

    createBoard() {
        this.board = [];
        this.revealedCount = 0;
        this.flagsLeft = this.mines;
        this.timer = 0;
        clearInterval(this.timerInterval);
        this.timerElem.textContent = '0';
        this.flagsLeftElem.textContent = this.flagsLeft;
        this.messageElem.textContent = '';
        this.messageElem.className = 'message';
        this.gameOver = false;
        this.firstClick = true;
        this.victoryAnim.style.display = "none";
        this.victoryAnim.innerHTML = "";

        this.boardElem.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.boardElem.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        this.boardElem.innerHTML = '';

        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    adjacent: 0,
                    elem: null
                };
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.tabIndex = 0;
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.oncontextmenu = e => e.preventDefault();
                cell.addEventListener('mousedown', (e) => {
                    if (this.gameOver) return;
                    if (e.button === 0) this.handleCellClick(r, c);
                    if (e.button === 2) this.toggleFlag(r, c);
                });
                cell.addEventListener('keydown', (e) => {
                    if (this.gameOver) return;
                    if (e.key === "Enter" || e.key === " ") this.handleCellClick(r, c);
                    if (e.key.toLowerCase() === "f") this.toggleFlag(r, c);
                });
                this.board[r][c].elem = cell;
                this.boardElem.appendChild(cell);
            }
        }
    }

    placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < this.mines) {
            let r = Math.floor(Math.random() * this.rows);
            let c = Math.floor(Math.random() * this.cols);
            if ((Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) || this.board[r][c].mine) continue;
            this.board[r][c].mine = true;
            placed++;
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc].mine) count++;
                    }
                }
                this.board[r][c].adjacent = count;
            }
        }
    }

    handleCellClick(r, c) {
        if (this.board[r][c].flagged || this.board[r][c].revealed) return;
        if (this.firstClick) {
            this.placeMines(r, c);
            this.startTimer();
            this.firstClick = false;
        }
        this.revealCell(r, c);
    }

    revealCell(r, c) {
        const cell = this.board[r][c];
        if (cell.revealed || cell.flagged) return;
        cell.revealed = true;
        cell.elem.classList.add('revealed');
        this.revealedCount++;

        if (cell.mine) {
            cell.elem.classList.add('mine');
            cell.elem.textContent = '🚩';
            this.endGame(false);
            return;
        }

        if (cell.adjacent > 0) {
            cell.elem.textContent = cell.adjacent;
            cell.elem.style.color = this.getColor(cell.adjacent);
        } else {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        if (!this.board[nr][nc].revealed) this.revealCell(nr, nc);
                    }
                }
            }
        }

        if (this.revealedCount === this.rows * this.cols - this.mines) {
            this.endGame(true);
        }
    }

    toggleFlag(r, c) {
        const cell = this.board[r][c];
        if (cell.revealed) return;
        if (cell.flagged) {
            cell.flagged = false;
            cell.elem.classList.remove('flag');
            cell.elem.textContent = '';
            this.flagsLeft++;
        } else if (this.flagsLeft > 0) {
            cell.flagged = true;
            cell.elem.classList.add('flag');
            cell.elem.textContent = '🚩';
            this.flagsLeft--;
        }
        this.flagsLeftElem.textContent = this.flagsLeft;
    }

    endGame(win) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        if (win) {
            this.messageElem.textContent = '¡Felicidades! Ganaste 🎉';
            this.messageElem.classList.add('win');
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c].mine) {
                        this.board[r][c].elem.classList.add('flag');
                        this.board[r][c].elem.textContent = '🚩';
                    }
                }
            }
            this.showVictoryAnimation();
            this.saveRanking(this.timer, this.rows, this.cols, this.mines);
            this.renderRanking();
        } else {
            this.messageElem.textContent = '¡Boom! Perdiste 💥';
            this.messageElem.classList.add('lose');
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c].mine) {
                        if (this.board[r][c].revealed) {
                            this.board[r][c].elem.classList.add('flag');
                            this.board[r][c].elem.textContent = '💣';
                        } else {
                            this.board[r][c].elem.classList.add('mine');
                            this.board[r][c].elem.textContent = '💣';
                        }
                    }
                }
            }
        }
    }

    getColor(n) {
        const colors = ['#2563eb', '#43b581', '#ffe066', '#ffb3ba', '#bae1ff', '#ff5858', '#b0b0b0', '#fff'];
        return colors[n - 1] || '#2563eb';
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.timerElem.textContent = this.timer;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElem.textContent = this.timer;
        }, 1000);
    }

    saveRanking(time, rows, cols, mines) {
        let ranking = JSON.parse(localStorage.getItem('minesweeperRanking') || "[]");
        ranking.push({ time, rows, cols, mines });
        ranking.sort((a, b) => a.time - b.time);
        if (ranking.length > 10) ranking = ranking.slice(0, 10);
        localStorage.setItem('minesweeperRanking', JSON.stringify(ranking));
    }

    renderRanking() {
        let ranking = JSON.parse(localStorage.getItem('minesweeperRanking') || "[]");
        this.rankingTable.innerHTML = "";
        ranking.forEach((r, i) => {
            this.rankingTable.innerHTML += `<tr>
                <td>${i + 1}</td>
                <td>${r.time}</td>
                <td>${r.rows}</td>
                <td>${r.cols}</td>
                <td>${r.mines}</td>
            </tr>`;
        });
    }

    showVictoryAnimation() {
        this.victoryAnim.style.display = "block";
        const colors = ["#2563eb", "#43b581", "#ffe066", "#ffb3ba", "#bae1ff", "#ff5858"];
        const emojis = ["🎉", "🎊", "✨", "💎", "⭐", "🥇"];
        for (let i = 0; i < 40; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti";
            confetti.style.left = (Math.random() * 90 + 5) + "%";
            confetti.style.top = (Math.random() * 10 - 5) + "%";
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.zIndex = 100;
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.fontSize = (Math.random() * 0.7 + 1.1) + "rem";
            this.victoryAnim.appendChild(confetti);
            setTimeout(() => confetti.remove(), 2000);
        }
        setTimeout(() => { this.victoryAnim.style.display = "none"; }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new MinesweeperGame({
        boardElem: document.getElementById('board'),
        timerElem: document.getElementById('timer'),
        flagsLeftElem: document.getElementById('flagsLeft'),
        messageElem: document.getElementById('message'),
        victoryAnim: document.getElementById('victory-animation'),
        rankingTable: document.getElementById('rankingTable').querySelector('tbody'),
        rowsInput: document.getElementById('rows'),
        colsInput: document.getElementById('cols'),
        minesInput: document.getElementById('mines')
    });

    document.getElementById('startBtn').addEventListener('click', () => game.createBoard());

    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = document.getElementById('themeIcon');

    function setTheme(dark) {
        document.body.classList.toggle('dark', dark);
        themeIcon.textContent = dark ? '☀️' : '🌙';
        localStorage.setItem('minesweeperTheme', dark ? 'dark' : 'light');
        document.body.style.transition = 'background 0.5s';
        setTimeout(() => { document.body.style.transition = ''; }, 600);
    }

    const savedTheme = localStorage.getItem('minesweeperTheme');
    if (savedTheme === 'dark') setTheme(true);

    themeBtn.addEventListener('click', () => {
        setTheme(!document.body.classList.contains('dark'));
    });
});