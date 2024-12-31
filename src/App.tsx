import { useState, useEffect, useCallback } from 'react';
import './App.css';

const BOARD_SIZE = 10;
const INITIAL_SNAKE = [{ x: 2, y: 2 }];
const INITIAL_DIRECTION = { x: 0, y: 1 };

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 5, y: 5 });
  };

  const moveSnake = useCallback(() => {
    if (!gameStarted) return;
    setSnake(prevSnake => {
      const newHead = {
        x: prevSnake[0].x + direction.x,
        y: prevSnake[0].y + direction.y,
      };

      if (
        newHead.x < 0 || newHead.x >= BOARD_SIZE ||
        newHead.y < 0 || newHead.y >= BOARD_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        return prevSnake;
      }

      let newSnake;
      if (newHead.x === food.x && newHead.y === food.y) {
        newSnake = [newHead, ...prevSnake];
        setFood({
          x: Math.floor(Math.random() * BOARD_SIZE),
          y: Math.floor(Math.random() * BOARD_SIZE),
        });
      } else {
        newSnake = [newHead, ...prevSnake.slice(0, -1)];
      }

      return newSnake;
    });
  }, [direction, food, gameStarted]);

  const changeDirection = (e: KeyboardEvent) => {
    setDirection(prevDirection => {
      switch (e.key) {
        case 'ArrowLeft':
          return { x: -prevDirection.y, y: prevDirection.x };
        case 'ArrowRight':
          return { x: prevDirection.y, y: -prevDirection.x };
        default:
          return prevDirection;
      }
    });
  };

  const handleSwipe = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0) {
        // Swipe right
        setDirection({ x: direction.y, y: -direction.x });
      } else {
        // Swipe left
        setDirection({ x: -direction.y, y: direction.x });
      }
    }
  }, [direction]);

  useEffect(() => {
    let startX: number;
    let startY: number;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      handleSwipe(startX, startY, endX, endY);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleSwipe]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;
    const interval = setInterval(moveSnake, 200);
    document.addEventListener('keydown', changeDirection);
    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', changeDirection);
    };
  }, [moveSnake, gameOver, gameStarted]);

  return (
    <>
      <h1 className="title">スネークゲーム</h1>
      <p>蛇を動かして、お餅をたくさん食べよう！</p>
      <div>
        <h2 className="subtitle">操作説明</h2>
        <p>キーボードの左右キーで操作します。<br />左右スワイプでも操作できます。</p>
      </div>
      {!gameStarted ? (
        <button onClick={startGame}>はじめる</button>
      ) : (
        <div className="board">
          {gameOver ? (
            <div className="game-over">
              <h2>あけまして<br />おめでとうございます！</h2>
              <p>あなたのスコアは{snake.length - 1}点です。</p>
              <button onClick={startGame}>もう一度遊ぶ</button>
            </div>
          ) : (
            Array.from({ length: BOARD_SIZE }).map((_, row) => (
              <div key={row} className="row">
                {Array.from({ length: BOARD_SIZE }).map((_, col) => (
                  <div
                    key={col}
                    className={`cell ${snake.some(segment => segment.x === col && segment.y === row)
                      ? 'snake'
                      : food.x === col && food.y === row
                        ? 'food'
                        : ''
                      }`}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}

export default App;
