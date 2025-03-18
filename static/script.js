// 新增全域變數與 DOM 元素引用
let board = [];
let score = 0;
let gameWon = false;
let boardSize = 4; // 預設棋盤尺寸 (4x4)

const gameBoard = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const newGameButton = document.getElementById("new-game-button");
const saveScoreModal = document.getElementById("save-score-modal");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const closeButton = document.querySelector(".close-button");
const playerNameInput = document.getElementById("player-name");
const modalScoreElement = document.getElementById("modal-score");

// 新增：棋盤尺寸按鈕 DOM 引用
const smallBoardButton = document.getElementById("small-board-button");
const mediumBoardButton = document.getElementById("medium-board-button");
const largeBoardButton = document.getElementById("large-board-button");

// 新增全域變數，用于缩放功能
let scaleFactor = 1.0; // 初始缩放比例
const MIN_SCALE = 0.5; // 最小缩放比例
const MAX_SCALE = 1.5; // 最大缩放比例
const SCALE_STEP = 0.1; // 每次缩放步长

// 在DOM元素引用部分添加
const zoomInButton = document.getElementById("zoom-in-button");
const zoomOutButton = document.getElementById("zoom-out-button");

// 初始化遊戲，建立棋盤並隨機加入兩個數字
function init() {
    board = [];
    for (let i = 0; i < boardSize; i++) {
        let row = [];
        for (let j = 0; j < boardSize; j++) {
            row.push(0);
        }
        board.push(row);
    }

    // 根據棋盤尺寸調整格子大小及間距
    const cellSize = boardSize === 3 ? 130 : boardSize === 5 ? 75 : 100;
    const padding = 10; // 棋盤內邊距
    const gap = 5; // 格子之間的間距

    // 計算棋盤整體大小，加上內邊距
    const boardWidth = (cellSize * boardSize) + (gap * (boardSize - 1)) + (padding * 2);
    const boardHeight = boardWidth; // 保持棋盤為正方形

    // 設定棋盤樣式
    gameBoard.style.width = boardWidth + "px";
    gameBoard.style.height = boardHeight + "px";
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
    gameBoard.style.gap = gap + "px";
    gameBoard.style.padding = padding + "px";

    // 立即顯示棋盤尺寸在頁面上，以確認按鈕生效
    document.title = `2048遊戲 - ${boardSize}x${boardSize}`;

    // 清除棋盤並重新建立
    gameBoard.innerHTML = '';
    addNumber();
    addNumber();
    score = 0;
    gameWon = false;
    updateBoard();
    updateScore();

    console.log(`棋盤尺寸已變更為 ${boardSize}x${boardSize}`); // 調試用

    // 创建游戏容器如果不存在
    let gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
        // 如果容器不存在，创建一个，并把棋盘及相关元素移到里面
        gameContainer = document.createElement("div");
        gameContainer.id = "game-container";
        const gameBoardParent = gameBoard.parentNode;

        // 找出所有需要包含在game-container中的元素
        const scoreDisplay = document.getElementById("score-display");
        const controlButtons = document.getElementById("control-buttons");
        const sizeButtons = document.getElementById("size-buttons");

        // 移动元素到新容器
        gameBoardParent.insertBefore(gameContainer, gameBoard);
        gameContainer.appendChild(gameBoard);
        gameContainer.appendChild(scoreDisplay);
        gameContainer.appendChild(controlButtons);
        gameContainer.appendChild(sizeButtons);
    }

    // 应用当前缩放比例
    applyScale();
}

// 建立棋盤的 HTML 顯示，每個格子根據數值設定背景與文字顏色
function updateBoard() {
    gameBoard.innerHTML = '';
    const cellSize = boardSize <= 3 ? 120 : boardSize >= 5 ? 70 : 90;

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            let cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.textContent = board[i][j] === 0 ? '' : board[i][j];
            cell.style.backgroundColor = getBackgroundColor(board[i][j]);
            cell.style.color = getTextColor(board[i][j]);

            // 不再額外減去邊框和間距，讓CSS grid處理
            cell.style.width = "100%";
            cell.style.height = "100%";
            cell.style.fontSize = boardSize <= 3 ? "2.5em" : boardSize >= 5 ? "1.6em" : "2em";

            gameBoard.appendChild(cell);
        }
    }
}

// 新增：在隨機空格中生成數字（2 或 4）
function addNumber() {
    let options = [];
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === 0) {
                options.push({ i, j });
            }
        }
    }
    if (options.length > 0) {
        let spot = options[Math.floor(Math.random() * options.length)];
        board[spot.i][spot.j] = Math.random() < 0.9 ? 2 : 4;
    }
}

// 遊戲結束處理，顯示儲存分數 Modal
function endGame() {
    // 再次确保分数显示是最新的
    updateScore();

    // 记录日志以便调试
    console.log(`游戏结束处理，当前分数: ${score}，HTML显示分数: ${scoreElement.textContent}`);

    if (gameWon) {
        alert(`恭喜！您達到了 2048！分數: ${score}`);
    } else {
        alert(`遊戲結束！分數: ${score}`);
    }

    // 確保模態框中顯示的分數與遊戲當前分數完全一致
    modalScoreElement.textContent = score;

    // 不管是勝利或失敗，都顯示儲存分數視窗
    saveScoreModal.style.display = "block";
}

// 輔助函式：將非零數值向左對齊，依據 row 長度填滿零
function slide(row) {
    let arr = row.filter(num => num !== 0);
    while (arr.length < row.length) {
        arr.push(0);
    }
    return arr;
}

// 輔助函式：合併相鄰同值，依據 row 長度執行
function merge(row) {
    let scoreAdded = 0; // 记录本次合并增加的分数

    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            scoreAdded += row[i]; // 累计增加的分数
            row[i + 1] = 0;
            if (row[i] === 2048) {
                gameWon = true;
            }
        }
    }

    // 在合并完成后更新总分
    if (scoreAdded > 0) {
        score += scoreAdded;
        console.log(`合并增加分数: ${scoreAdded}，当前总分: ${score}`);
    }

    return row;
}

// 對單列進行處理：先壓縮，再合併，再壓縮
function processRow(row) {
    row = slide(row);
    row = merge(row);
    row = slide(row);
    return row;
}

// 移動：根據方向更新棋盤（支援 left, right, up, down）
function move(direction) {
    const previous = JSON.stringify(board);
    let newBoard = board.map(row => row.slice());
    let scoreBeforeMove = score; // 记录移动前的分数

    // 針對上、下方向先進行轉置，右、下則反轉每列
    if (direction === 'up' || direction === 'down') {
        newBoard = transpose(newBoard);
    }
    if (direction === 'right' || direction === 'down') {
        newBoard = newBoard.map(row => row.reverse());
    }

    newBoard = newBoard.map(row => processRow(row));

    if (direction === 'right' || direction === 'down') {
        newBoard = newBoard.map(row => row.reverse());
    }
    if (direction === 'up' || direction === 'down') {
        newBoard = transpose(newBoard);
    }

    board = newBoard;
    if (JSON.stringify(board) !== previous) {
        addNumber();
        updateBoard();

        // 先更新分数显示
        updateScore();

        // 检查游戏是否结束前记录最新分数
        if (isGameOver()) {
            console.log(`游戏结束，最终得分: ${score}，移动前得分: ${scoreBeforeMove}`);

            // 确保HTML界面上的分数显示已更新
            setTimeout(() => {
                endGame();
            }, 50); // 添加小延迟确保DOM更新
        }
    }
}

// 輔助函式：轉置 2D 陣列
function transpose(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

// 更新分數顯示 - 确保所有地方的分数显示都同步
function updateScore() {
    // 更新主界面的分數
    scoreElement.textContent = score;

    // 同時更新模態框中的分數顯示
    if (modalScoreElement) {
        modalScoreElement.textContent = score;
    }

    // 输出日志便于调试
    console.log(`分数已更新: ${score}`);
}

// 判斷是否無法移動
function isGameOver() {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === 0) return false;
            if (j < board[i].length - 1 && board[i][j] === board[i][j + 1]) return false;
            if (i < board.length - 1 && board[i][j] === board[i + 1][j]) return false;
        }
    }
    return true;
}

// 取得背景顏色函式 (根據數字)
function getBackgroundColor(value) {
    switch (value) {
        case 2: return '#eee4da';
        case 4: return '#ede0c8';
        case 8: return '#f2b179';
        case 16: return '#f59563';
        case 32: return '#f67c5f';
        case 64: return '#f65e3b';
        case 128: return '#edcf72';
        case 256: return '#edcc61';
        case 512: return '#edc850';
        case 1024: return '#edc53f';
        case 2048: return '#edc22e';
        default: return '#cdc1b4';
    }
}

// 取得文字顏色函式
function getTextColor(value) {
    return value <= 4 ? '#776e65' : '#f9f6f2';
}

// 事件：頁面載入完成後即建立棋盤
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// 新遊戲按鈕點擊事件 (重新初始化棋盤)
newGameButton.addEventListener('click', () => {
    // 為新遊戲按鈕也增加提示訊息
    alert(`開始新的遊戲！\n\n當前棋盤大小: ${boardSize}x${boardSize}\n\n• 使用方向鍵或觸控滑動控制方塊\n• 合併相同數字得分\n• 達到2048即可獲勝！`);
    init();
});

// 鍵盤事件處理 (控制方塊移動)
document.addEventListener('keydown', (event) => {
    // 當 Modal 顯示時，忽略移動事件
    if (saveScoreModal.style.display === "block") return;
    event.preventDefault();
    if (event.key === 'ArrowUp') {
        move('up');
    } else if (event.key === 'ArrowDown') {
        move('down');
    } else if (event.key === 'ArrowLeft') {
        move('left');
    } else if (event.key === 'ArrowRight') {
        move('right');
    }
});

// 新增：觸控事件處理 (支援手機平板滑動操作)
let touchStartX = 0, touchStartY = 0;
gameBoard.addEventListener('touchstart', (event) => {
    // 當 Modal 顯示時，不處理觸控操作
    if (saveScoreModal.style.display === "block") return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});
gameBoard.addEventListener('touchend', (event) => {
    if (saveScoreModal.style.display === "block") return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const threshold = 30; // 最小滑動閾值
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                move('right');
            } else {
                move('left');
            }
        }
    } else {
        if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) {
                move('down');
            } else {
                move('up');
            }
        }
    }
});

// Modal 按鈕事件處理
saveButton.addEventListener('click', saveScore);
cancelButton.addEventListener('click', () => {
    // 修改：當玩家取消輸入時，以"none"作為玩家姓名進行記錄
    saveScoreWithDefault("none");
    saveScoreModal.style.display = "none";
    playerNameInput.value = '';
});
closeButton.addEventListener('click', () => {
    // 修改：當玩家關閉視窗時，以"none"作為玩家姓名進行記錄
    saveScoreWithDefault("none");
    saveScoreModal.style.display = "none";
});

// 修改：棋盤尺寸按鈕事件處理，增加詳細提示信息
smallBoardButton.addEventListener('click', () => {
    boardSize = 3; // 小棋盤: 3x3
    alert(`您選擇了小棋盤(3×3)：\n\n• 棋盤將縮小為 3×3 格子\n• 每個格子會變得較大\n• 遊戲難度降低\n• 更容易合併達到 2048`);
    init();
});

mediumBoardButton.addEventListener('click', () => {
    boardSize = 4; // 中棋盤: 4x4
    alert(`您選擇了中棋盤(4×4)：\n\n• 棋盤為標準的 4×4 格子\n• 傳統的 2048 遊戲模式\n• 標準難度`);
    init();
});

largeBoardButton.addEventListener('click', () => {
    boardSize = 5; // 大棋盤: 5x5
    alert(`您選擇了大棋盤(5×5)：\n\n• 棋盤擴大為 5×5 格子\n• 每個格子會變得較小\n• 遊戲難度提高\n• 能夠嘗試更高級的策略`);
    init();
});

// 實現 saveScore 函數 - 確保使用最新分數
async function saveScore() {
    const playerName = playerNameInput.value.trim();

    if (!playerName) {
        alert('請輸入您的名字！');
        return;
    }

    // 再次確認模態框中的分數與當前分數一致
    modalScoreElement.textContent = score;

    await saveScoreWithDefault(playerName);
}

// 新增：使用默認名稱保存分數
async function saveScoreWithDefault(playerName) {
    try {
        const currentTime = Date.now();

        // 調試輸出，確認保存時使用的分數值
        console.log(`准备保存数据: name=${playerName}, score=${score}, is_success=${gameWon}`);

        // 构建FormData对象，让浏览器自动处理Content-Type
        const formData = new FormData();
        formData.append('name', playerName);
        formData.append('time', currentTime);
        formData.append('score', score);
        formData.append('is_success', gameWon ? "true" : "false");

        const response = await fetch('/save_score', {
            method: 'POST',
            body: formData // 不再手动设置Content-Type
        });

        // 记录响应详情
        console.log(`响应状态: ${response.status}`);
        const responseText = await response.text();
        console.log(`响应内容: ${responseText}`);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('无法解析响应为JSON:', e);
            data = { message: '服务器响应格式错误' };
        }

        if (response.ok) {
            if (playerName !== "none") {
                alert(`恭喜 ${playerName}！您的分數 ${score} 已成功儲存！`);
            }
            saveScoreModal.style.display = "none";
            playerNameInput.value = '';
        } else {
            throw new Error(data.message || '儲存失敗');
        }
    } catch (error) {
        console.error('儲存分數失敗:', error);
        alert('儲存分數時發生錯誤，請重試！詳情請查看控制台');
    }
}

// 应用缩放比例函数
function applyScale() {
    const gameContainer = document.getElementById("game-container");
    gameContainer.style.transform = `scale(${scaleFactor})`;
    gameContainer.style.transformOrigin = "top center";
}

// 放大函数
function zoomIn() {
    if (scaleFactor < MAX_SCALE) {
        scaleFactor += SCALE_STEP;
        applyScale();
    }
}

// 缩小函数
function zoomOut() {
    if (scaleFactor > MIN_SCALE) {
        scaleFactor -= SCALE_STEP;
        applyScale();
    }
}

// 添加放大缩小按钮事件监听
zoomInButton.addEventListener('click', zoomIn);
zoomOutButton.addEventListener('click', zoomOut);