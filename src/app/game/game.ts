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
  templateUrl: './game.html',
  styleUrls: ['./game.css']
})
export class Game implements OnInit, OnDestroy {
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  gameRunning = false;
  animationId!: number;

  canvasWidth = 800;
  canvasHeight = 400;

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
    this.gameLoop();
  }

  gameLoop(): void {
    if (!this.gameRunning) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  update(): void {
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    if (this.ball.y <= this.ball.radius || 
        this.ball.y >= this.canvasHeight - this.ball.radius) {
      this.ball.dy = -this.ball.dy;
    }

    this.checkPaddleCollision();

    if (this.ball.x < 0) {
      this.rightScore++;
      this.resetBall();
    } else if (this.ball.x > this.canvasWidth) {
      this.leftScore++;
      this.resetBall();
    }

    this.updatePaddles();
  }

  checkPaddleCollision(): void {
    if (this.ball.x - this.ball.radius <= this.leftPaddle.x + this.leftPaddle.width &&
        this.ball.x - this.ball.radius >= this.leftPaddle.x &&
        this.ball.y >= this.leftPaddle.y &&
        this.ball.y <= this.leftPaddle.y + this.leftPaddle.height) {
      this.ball.dx = Math.abs(this.ball.dx);
    }

    if (this.ball.x + this.ball.radius >= this.rightPaddle.x &&
        this.ball.x + this.ball.radius <= this.rightPaddle.x + this.rightPaddle.width &&
        this.ball.y >= this.rightPaddle.y &&
        this.ball.y <= this.rightPaddle.y + this.rightPaddle.height) {
      this.ball.dx = -Math.abs(this.ball.dx);
    }
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

  // AI logic removed - paddle only moves with user input
}


  draw(): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.strokeStyle = '#fff';
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvasWidth / 2, 0);
    this.ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, 
                     this.leftPaddle.width, this.leftPaddle.height);
    this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, 
                     this.rightPaddle.width, this.rightPaddle.height);

    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();

    this.ctx.font = '36px Arial';
    this.ctx.fillText(this.leftScore.toString(), this.canvasWidth / 4, 50);
    this.ctx.fillText(this.rightScore.toString(), (3 * this.canvasWidth) / 4, 50);
  }

  resetBall(): void {
    this.ball.x = this.canvasWidth / 2;
    this.ball.y = this.canvasHeight / 2;
    this.ball.dx = Math.random() > 0.5 ? 5 : -5;
    this.ball.dy = (Math.random() - 0.5) * 6;
  }

  resetGame(): void {
    this.leftScore = 0;
    this.rightScore = 0;
    this.resetBall();
  }

  togglePause(): void {
    this.gameRunning = !this.gameRunning;
    if (this.gameRunning) {
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
