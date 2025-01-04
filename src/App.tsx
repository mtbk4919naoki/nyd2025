import { useState, useEffect, useCallback } from 'react';
import './App.css';

const BOARD_SIZE = 10;
const INITIAL_SNAKE = [{ x: 2, y: 2 }];
const INITIAL_DIRECTION = { x: 0, y: 1 };
const DELAY_TIME = 200;

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState('ahead');
  const [startTime, setStartTime] = useState(0);
  const [isKeydown, setIsKeydown] = useState(false);
  const [directionQueue, setDirectionQueue] = useState('ahead');
  const generateFoodPosition = (snake: { x: number, y: number }[]) => {
    let newFoodPosition: { x: number, y: number };
    do {
      newFoodPosition = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
    } while (snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
    return newFoodPosition;
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFoodPosition(INITIAL_SNAKE));
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
        prevSnake.slice(0, -1).some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        return prevSnake;
      }

      let newSnake;
      if (newHead.x === food.x && newHead.y === food.y) {
        newSnake = [newHead, ...prevSnake];
        if (newSnake.length === BOARD_SIZE * BOARD_SIZE) {
          setGameOver(true);
        } else {
          setFood(generateFoodPosition(newSnake));
        }
      } else {
        newSnake = [newHead, ...prevSnake.slice(0, -1)];
      }

      return newSnake;
    });
  }, [direction, food, gameStarted, turn]);

  const changeDirection = (e: KeyboardEvent) => {
    setIsKeydown(true);
    setDirection(prevDirection => {
      switch (e.key) {
        case 'ArrowLeft':
          if (turn !== 'ahead') {
            setDirectionQueue('left');
          }
          if (turn !== 'left') {
            setTurn('left');
            return { x: -prevDirection.y, y: prevDirection.x };
          }
          return { x: prevDirection.x, y: prevDirection.y }
        case 'ArrowRight':
          if (turn !== 'ahead') {
            setDirectionQueue('right');
          }
          if (turn !== 'right') {
            setTurn('right');
            return { x: prevDirection.y, y: -prevDirection.x };
          }
          return { x: prevDirection.x, y: prevDirection.y }
        default:
          return prevDirection;
      }
    });
  };

  const handleSwipe = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    setIsKeydown(false);
    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0) {
        // Swipe right
        if (turn !== 'ahead') {
          setDirectionQueue('right');
        }
        if (turn !== 'right') {
          setTurn('right');
          setDirection({ x: direction.y, y: -direction.x });
        }
      } else {
        // Swipe left
        if (turn !== 'ahead') {
          setDirectionQueue('left');
        }
        if (turn !== 'left') {
          setTurn('left');
          setDirection({ x: -direction.y, y: direction.x });
        }
      }
    }
  }, [direction, turn, directionQueue]);

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
    let timeLeft = DELAY_TIME;
    if (isKeydown) {
      // キーボード操作の場合は操作遅延を無効にする
      timeLeft = Math.min(DELAY_TIME - (performance.now() - startTime) / 2, DELAY_TIME);
      if (timeLeft < 1) {
        timeLeft = DELAY_TIME;
      }
    }

    const interval = setInterval(() => {
      setTurn('ahead');
      moveSnake();
      if (directionQueue !== 'ahead') {
        if (directionQueue === 'left') {
          setTurn('left');
          setDirection({ x: -direction.y, y: direction.x });
        } else if (directionQueue === 'right') {
          setTurn('right');
          setDirection({ x: direction.y, y: -direction.x });
        }
        setDirectionQueue('ahead');
      }
      setStartTime(performance.now());

    }, timeLeft);
    document.addEventListener('keydown', changeDirection);
    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', changeDirection);
    };
  }, [moveSnake, gameOver, gameStarted]);

  return (
    <>
      <h1 className="title">スネークゲーム</h1>
      <p>蛇を動かしてお餅をたくさん食べよう！</p>
      <div>
        <h2 className="subtitle">操作説明</h2>
        <p>キーボードの左右キーで操作します。<br />左右スワイプでも操作できます。</p>
      </div>
      {!gameStarted ? (
        <div className="board" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button onClick={startGame}>はじめる</button>
        </div>
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
                      ? (col === snake[0].x && row === snake[0].y)
                        ? 'snake-head'
                        : 'snake'
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
