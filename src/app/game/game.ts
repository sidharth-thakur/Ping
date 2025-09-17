import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.html',
  styleUrls: ['./game.css']
})
export class Game implements OnInit, OnDestroy {
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  gameRunning = false;
  animationId!: number;

  // Game dimensions
  canvasWidth = 800;
  canvasHeight = 400;

  // Speed management properties
  baseSpeed = 5;
  currentSpeedMultiplier = 1.0;
  maxSpeedMultiplier = 3.0; // Increased max speed
  speedIncreaseInterval = 3000; // Changed to 3 seconds
  lastSpeedIncreaseTime = 0;
  gameStartTime = 0;

  // Level system
  currentLevel = 1;
  pointsPerLevel = 5;

  // Game objects
  ball: Ball = {
    x: 400,
    y: 200,
    dx: 5,
    dy: 3,
    radius: 10
  };

  leftPaddle: Paddle = {
    x: 20,
    y: 175,
    width: 15,
    height: 80
  };

  rightPaddle: Paddle = {
    x: 765,
    y: 175,
    width: 15,
    height: 80
  };

  // Game state
  leftScore = 0;
  rightScore = 0;
  keys: { [key: string]: boolean } = {};

  ngOnInit(): void {
    setTimeout(() => {
      this.initializeCanvas();
      this.startGame();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  initializeCanvas(): void {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('Canvas element not found!');
      return;
    }
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

  startGame(): void {
    this.gameRunning = true;
    this.gameStartTime = Date.now();
    this.lastSpeedIncreaseTime = Date.now();
    this.gameLoop();
  }

  gameLoop(): void {
    if (!this.gameRunning) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  update(): void {
    // Update ball position
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with top and bottom walls
    if (this.ball.y <= this.ball.radius || 
        this.ball.y >= this.canvasHeight - this.ball.radius) {
      this.ball.dy = -this.ball.dy;
    }

    // Ball collision with paddles
    this.checkPaddleCollision();

    // Ball out of bounds (scoring) - ADDED SPEED INCREASE ON SCORE
    if (this.ball.x < 0) {
      this.rightScore++;
      this.increaseSpeedOnScore(); // Speed increase when player misses
      this.resetBall();
    } else if (this.ball.x > this.canvasWidth) {
      this.leftScore++;
      this.increaseSpeedOnScore(); // Speed increase when player misses
      this.resetBall();
    }

    // Continuously increase speed over time
    this.increaseSpeedOverTime();

    // Paddle movement
    this.updatePaddles();
  }

  // NEW METHOD: Increase speed when someone scores (player misses)
  increaseSpeedOnScore(): void {
    if (this.currentSpeedMultiplier < this.maxSpeedMultiplier) {
      this.currentSpeedMultiplier = Math.min(this.currentSpeedMultiplier + 0.3, this.maxSpeedMultiplier);
      console.log(`Score speed increase! Speed: ${this.currentSpeedMultiplier.toFixed(1)}x`);
    }
  }

  // MODIFIED: Increase speed based on elapsed time (every 3 seconds)
  increaseSpeedOverTime(): void {
    const currentTime = Date.now();
    
    // Check if enough time has passed since last speed increase
    if (currentTime - this.lastSpeedIncreaseTime >= this.speedIncreaseInterval && 
        this.currentSpeedMultiplier < this.maxSpeedMultiplier) {
      
      // CHANGED: Increase speed by 0.3x every 3 seconds
      this.currentSpeedMultiplier = Math.min(this.currentSpeedMultiplier + 0.3, this.maxSpeedMultiplier);
      this.lastSpeedIncreaseTime = currentTime;

      // Apply new speed to current ball
      this.applyCurrentSpeedToBall();
      
      console.log(`Time speed increase! Speed: ${this.currentSpeedMultiplier.toFixed(1)}x`);
    }
  }

  // Apply current speed multiplier to ball while preserving direction
  applyCurrentSpeedToBall(): void {
    // Get current directions
    const directionX = this.ball.dx > 0 ? 1 : -1;
    const directionY = this.ball.dy > 0 ? 1 : -1;

    // Apply new horizontal speed
    this.ball.dx = directionX * this.baseSpeed * this.currentSpeedMultiplier;
    
    // Apply new vertical speed with reasonable limits
    const currentVerticalSpeed = Math.abs(this.ball.dy);
    const newVerticalSpeed = Math.min(currentVerticalSpeed * 1.1, 12); // Cap at 12
    this.ball.dy = directionY * newVerticalSpeed;
  }

  // Get current speed for new balls
  getCurrentSpeed(): number {
    return this.baseSpeed * this.currentSpeedMultiplier;
  }

  checkPaddleCollision(): void {
    // Left paddle collision
    if (this.ball.x - this.ball.radius <= this.leftPaddle.x + this.leftPaddle.width &&
        this.ball.x - this.ball.radius >= this.leftPaddle.x &&
        this.ball.y >= this.leftPaddle.y &&
        this.ball.y <= this.leftPaddle.y + this.leftPaddle.height) {
      this.ball.dx = Math.abs(this.ball.dx);
      this.addSpin();
    }

    // Right paddle collision
    if (this.ball.x + this.ball.radius >= this.rightPaddle.x &&
        this.ball.x + this.ball.radius <= this.rightPaddle.x + this.rightPaddle.width &&
        this.ball.y >= this.rightPaddle.y &&
        this.ball.y <= this.rightPaddle.y + this.rightPaddle.height) {
      this.ball.dx = -Math.abs(this.ball.dx);
      this.addSpin();
    }
  }

  addSpin(): void {
    // Add some randomness to make game more interesting
    this.ball.dy += (Math.random() - 0.5) * 2;
    // Limit vertical speed
    this.ball.dy = Math.max(-12, Math.min(12, this.ball.dy));
  }

  updatePaddles(): void {
    // Left paddle (Player 1) - W/S keys
    if (this.keys['KeyW'] && this.leftPaddle.y > 0) {
      this.leftPaddle.y -= 8;
    }
    if (this.keys['KeyS'] && this.leftPaddle.y < this.canvasHeight - this.leftPaddle.height) {
      this.leftPaddle.y += 8;
    }

    // Right paddle (Player 2) - Arrow keys ONLY
    if (this.keys['ArrowUp'] && this.rightPaddle.y > 0) {
      this.rightPaddle.y -= 8;
    }
    if (this.keys['ArrowDown'] && this.rightPaddle.y < this.canvasHeight - this.rightPaddle.height) {
      this.rightPaddle.y += 8;
    }
  }

  draw(): void {
    if (!this.ctx) return;

    // Clear canvas with black background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw dashed center line
    this.ctx.strokeStyle = '#fff';
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvasWidth / 2, 0);
    this.ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw paddles in white
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, 
                     this.leftPaddle.width, this.leftPaddle.height);
    this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, 
                     this.rightPaddle.width, this.rightPaddle.height);

    // Draw ball as white circle
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();

    // Draw scores in large font at the top
    this.ctx.font = '36px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(this.leftScore.toString(), this.canvasWidth / 4, 50);
    this.ctx.fillText(this.rightScore.toString(), (3 * this.canvasWidth) / 4, 50);

    // Draw current speed multiplier in bottom center
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#FFD700';
    const speedText = `Speed: ${this.currentSpeedMultiplier.toFixed(1)}x`;
    const textWidth = this.ctx.measureText(speedText).width;
    this.ctx.fillText(speedText, (this.canvasWidth - textWidth) / 2, this.canvasHeight - 20);

    // Draw game timer
    if (this.gameStartTime > 0) {
      const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#CCCCCC';
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      this.ctx.fillText(timeText, 10, 30);
    }

    // MODIFIED: Show next speed increase countdown (now every 3 seconds)
    const timeToNextIncrease = this.speedIncreaseInterval - (Date.now() - this.lastSpeedIncreaseTime);
    if (timeToNextIncrease > 0 && this.currentSpeedMultiplier < this.maxSpeedMultiplier) {
      const secondsLeft = Math.ceil(timeToNextIncrease / 1000);
      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.fillText(`Next: ${secondsLeft}s`, this.canvasWidth - 80, 30);
    }
  }

  // MODIFIED: resetBall now uses current speed multiplier
  resetBall(): void {
    this.ball.x = this.canvasWidth / 2;
    this.ball.y = this.canvasHeight / 2;
    
    // NEW BALL SPAWNS WITH CURRENT SPEED MULTIPLIER
    const directionX = Math.random() > 0.5 ? 1 : -1;
    const directionY = Math.random() > 0.5 ? 1 : -1;
    
    this.ball.dx = directionX * this.baseSpeed * this.currentSpeedMultiplier;
    this.ball.dy = directionY * (Math.random() * 6 - 3);
  }

  resetGame(): void {
    this.leftScore = 0;
    this.rightScore = 0;
    this.currentSpeedMultiplier = 1.0;
    this.gameStartTime = Date.now();
    this.lastSpeedIncreaseTime = Date.now();
    this.currentLevel = 1;
    this.resetBall();
  }

  togglePause(): void {
    this.gameRunning = !this.gameRunning;
    if (this.gameRunning) {
      // Resume timers when unpausing
      const now = Date.now();
      const pausedDuration = now - this.lastSpeedIncreaseTime;
      this.gameStartTime = now - (now - this.gameStartTime);
      this.lastSpeedIncreaseTime = now - (pausedDuration % this.speedIncreaseInterval);
      this.gameLoop();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.keys[event.code] = true;
    
    if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    
    if (event.code === 'Space') {
      this.togglePause();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.keys[event.code] = false;
  }
}
