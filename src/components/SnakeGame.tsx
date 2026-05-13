import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Pause, Keyboard } from 'lucide-react';

/**
 * Constants for the game
 */
const GRID_SIZE = 25;
const CANVAS_SIZE = 600;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 500;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 250;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_DIRECTION: Direction = 'UP';

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const lastUpdateTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(null);

  // Generate random food position not on snake
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setScore(0);
    setFood(generateFood(INITIAL_SNAKE));
    setStatus('PLAYING');
  };

  const gameOver = () => {
    setStatus('GAME_OVER');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      // Update actual direction from buffer
      setDirection(nextDirection);

      switch (nextDirection) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Wall Collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        gameOver();
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food Consumption
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    },);
  }, [food, nextDirection, generateFood, score, highScore]);

  // Game Loop
  const animate = useCallback(
    (time: number) => {
      if (status === 'PLAYING') {
        const currentSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(score / 50) * SPEED_INCREMENT);
        
        if (time - lastUpdateTimeRef.current > currentSpeed) {
          moveSnake();
          lastUpdateTimeRef.current = time;
        }
      }
      
      // Draw frame
      draw();
      requestRef.current = requestAnimationFrame(animate);
    },
    [status, moveSnake, score]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
        case ' ':
          if (status === 'PLAYING') setStatus('PAUSED');
          else if (status === 'PAUSED') setStatus('PLAYING');
          else if (status === 'IDLE' || status === 'GAME_OVER') resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, status]);

  // Drawing
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Grid (Subtle)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
       ctx.beginPath();
       ctx.moveTo(i * CELL_SIZE, 0);
       ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
       ctx.stroke();

       ctx.beginPath();
       ctx.moveTo(0, i * CELL_SIZE);
       ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
       ctx.stroke();
    }

    // Draw Food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3e3e';
    ctx.fillStyle = '#ff3e3e';
    ctx.beginPath();
    ctx.roundRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
      4
    );
    ctx.fill();

    // Draw Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff41';
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#00ff41' : '#00cc33';
      
      ctx.beginPath();
      ctx.roundRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
        isHead ? 4 : 2
      );
      ctx.fill();

      // Draw eyes on head
      if (isHead) {
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        const eyeSize = 3;
        const offset = 6;
        
        if (direction === 'UP' || direction === 'DOWN') {
            ctx.fillRect(segment.x * CELL_SIZE + offset, segment.y * CELL_SIZE + (direction === 'UP' ? offset : CELL_SIZE - offset - eyeSize), eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize, segment.y * CELL_SIZE + (direction === 'UP' ? offset : CELL_SIZE - offset - eyeSize), eyeSize, eyeSize);
        } else {
            ctx.fillRect(segment.x * CELL_SIZE + (direction === 'LEFT' ? offset : CELL_SIZE - offset - eyeSize), segment.y * CELL_SIZE + offset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + (direction === 'LEFT' ? offset : CELL_SIZE - offset - eyeSize), segment.y * CELL_SIZE + CELL_SIZE - offset - eyeSize, eyeSize, eyeSize);
        }
      }
    });

    ctx.shadowBlur = 0;
  };

  return (
    <div className="flex w-full h-[768px] max-w-[1024px] bg-cyber-bg border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <aside className="w-[280px] bg-cyber-panel border-right border-white/5 p-10 flex flex-col gap-8">
        <div className="text-sm font-black tracking-[0.3em] text-cyber-accent uppercase">
          CYBER_SNAKE v1.0
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 p-5 rounded-sm">
            <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">目前得分</div>
            <div className="text-3xl font-bold text-white font-mono">{score.toString().padStart(6, '0')}</div>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-sm">
            <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">最高紀錄</div>
            <div className="text-3xl font-bold text-white/60 font-mono">{highScore.toString().padStart(6, '0')}</div>
          </div>
        </div>

        {/* System Log */}
        <div className="mt-4 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-[#666] mb-3">系統日誌</div>
          <div className="font-mono text-[10px] space-y-2 opacity-60">
            <div className="flex gap-2 text-white/40">
              <span>{new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
              <span className="text-white/60">系統初始化完成</span>
            </div>
            {score > 0 && (
              <div className="flex gap-2 text-cyber-accent">
                <span>{new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                <span>檢測到數據增長 +{score}pt</span>
              </div>
            )}
            {status === 'GAME_OVER' && (
              <div className="flex gap-2 text-cyber-food font-bold">
                <span>{new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                <span>連線已意外終止</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Visual */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div />
          <div className={`w-10 h-10 border border-white/20 rounded flex items-center justify-center text-[10px] ${direction === 'UP' ? 'bg-cyber-accent text-black' : 'text-white/30'}`}>W</div>
          <div />
          <div className={`w-10 h-10 border border-white/20 rounded flex items-center justify-center text-[10px] ${direction === 'LEFT' ? 'bg-cyber-accent text-black' : 'text-white/30'}`}>A</div>
          <div className={`w-10 h-10 border border-white/20 rounded flex items-center justify-center text-[10px] ${direction === 'DOWN' ? 'bg-cyber-accent text-black' : 'text-white/40 font-bold'}`}>S</div>
          <div className={`w-10 h-10 border border-white/20 rounded flex items-center justify-center text-[10px] ${direction === 'RIGHT' ? 'bg-cyber-accent text-black' : 'text-white/30'}`}>D</div>
        </div>
      </aside>

      {/* Main Game View */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative bg-black">
        <div className="w-[600px] flex justify-between mb-5">
           <div className={`px-3 py-1 text-[10px] border rounded-sm font-bold tracking-tighter ${status === 'PLAYING' ? 'border-cyber-accent text-cyber-accent' : 'border-white/20 text-white/20'}`}>
             系統狀態：{status === 'PLAYING' ? '執行中' : status === 'PAUSED' ? '已暫停' : status === 'IDLE' ? '待命' : '核心損毀'}
           </div>
           <div className="px-3 py-1 text-[10px] border border-white/10 text-white/40 rounded-sm font-mono">
             FPS: 60.0
           </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border-2 border-white/10 rounded shadow-[0_0_50px_rgba(0,255,65,0.05)]"
          />

          {/* Overlays */}
          <AnimatePresence>
            {status !== 'PLAYING' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded"
              >
                <div className="text-center flex flex-col items-center gap-6">
                  {status === 'IDLE' && (
                    <>
                      <div className="w-16 h-[2px] bg-cyber-accent" />
                      <h2 className="text-3xl font-black italic tracking-tighter text-white">準備啟動系統</h2>
                      <button
                        onClick={resetGame}
                        className="px-8 py-3 bg-cyber-accent text-black font-bold text-sm tracking-widest rounded-sm hover:translate-y-[-2px] transition-transform cursor-pointer"
                      >
                        初始化賽程
                      </button>
                    </>
                  )}

                  {status === 'PAUSED' && (
                    <>
                      <h2 className="text-3xl font-black italic tracking-tighter text-white/40">連線暫停中</h2>
                      <button
                        onClick={() => setStatus('PLAYING')}
                        className="px-8 py-3 bg-white text-black font-bold text-sm tracking-widest rounded-sm cursor-pointer"
                      >
                        恢復傳輸
                      </button>
                    </>
                  )}

                  {status === 'GAME_OVER' && (
                    <>
                      <div className="text-cyber-food">
                        <h2 className="text-6xl font-black italic tracking-tighter mb-2">核心損毀</h2>
                        <p className="font-mono text-xs uppercase tracking-widest opacity-60">檢測到非法數據碰撞</p>
                      </div>
                      <button
                        onClick={resetGame}
                        className="px-8 py-3 bg-cyber-accent text-black font-bold text-sm tracking-widest rounded-sm cursor-pointer mt-4"
                      >
                        重新啟動系統
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 font-mono text-[10px] text-white/20 tracking-[0.3em] uppercase">
          按 [空格鍵] 暫停當前賽程
        </div>
      </main>
    </div>
  );
};

export default SnakeGame;
