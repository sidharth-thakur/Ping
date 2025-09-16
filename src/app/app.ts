import { Component } from '@angular/core';
import { Game } from './game/game';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Game],  // Import the Game component here
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'Ping Pong Game';
}
