# bounce 
Play ➡️ <a href="https://uba.github.io/bounce" target="_blank">here!</a>

✨ Inspired by the idea of Daniel Barral (UFJF/2003) and the work of Hakim El Hattab (https://hakim.se/).

*"Games shouldn't only be fun. They should teach or spark an interest in other things." — Hideo Kojima*

... including how they are made. 🧑🏻‍💻

https://github.com/user-attachments/assets/ff8c8392-756e-402e-b16d-6a91ef57f1b2

# ChatGPT description based on the [bounce.js](src/bounce.js) code

This JavaScript code defines the main logic of a browser-based game called **Bounce**.

It's a simple 2D arcade-style game that involves a bouncing ball (the player) avoiding enemies while earning points.

## 🕹️ Game Overview

- You control a **bouncing ball** (player).
- The ball moves up and down using a **quadratic function** (a parabola) to simulate bouncing.
- You can move the ball **left or right** using the arrow keys or touch controls (on mobile).
- The goal is to **avoid enemies** (other moving balls).
- **Colliding with an enemy** ends the game.
- You earn points for each **successful bounce** off the bottom of the screen.
- **Special effects** like particles and sound effects provide feedback.

## 🧠 Core Logic

### 🎮 Game Loop

The game runs inside a `requestAnimationFrame` loop (update function), which redraws the screen every frame. In each frame:

- The game clears and redraws the canvas.
- The player and enemies are updated and rendered.
- Particles and notifications are animated.
- **Collision detection** is performed.

### 🧮 Movement

- The **vertical motion** of the player is modeled using a **quadratic function** to simulate bouncing (y = ax² + bx + c).
- The **horizontal motion** is controlled by player input (keyboard or touch).

### 👾 Enemies

- Enemies move **horizontally** and bounce off the screen edges.
- Each time they hit an edge, they **accelerate slightly**.

### 💥 Collision Detection

- If the player ball intersects with an enemy ball, a **particle explosion** occurs, a "dead" sound plays, and the game ends.

### 🔊 Sound Effects

- Uses the **Howler.js** library to play sounds.
- Includes **background music** and effects for actions like bouncing, starting the game, and collisions.
- A **sound toggle button** allows muting/unmuting.

### 📱 Mobile Support

- The game detects if it's being played on a **mobile device**.
- On mobile, **left/right buttons** are shown on-screen to control the player.

### 🧩 Entities

- **Ball**: Represents both the player and enemies.
- **Particle**: Small squares emitted on collisions or actions for visual effect.
- **Notification**: Text messages that float up for scores and bonuses.

### 🎨 Graphics

- Uses the **Canvas API** to render the game.
- Balls are drawn with **gradients and shadows**.
- Particles and score messages **fade out** over time.

### 💾 Score and High Score

- The **current score** increases with each bounce.
- Every **10 points**, a notification and special effect trigger.
- **High scores** are saved using the browser's `localStorage`.

### 🚀 Initialization

- Sounds are **preloaded** before the game starts.
- Once loaded, the **menu fades in** and waits for player input.

### 📐 Resizing

- The game **dynamically adjusts** to screen size, especially for mobile.

### 🧪 Utility Functions

- **isMobile()** detects mobile devices.
- **getRandomColor()** generates a random RGB color.
- **Point** and **Entity** are basic geometry helpers.

In summary, this is a polished, interactive bouncing-ball game with sound effects, animations, and mobile compatibility — inspired by classic arcade games, built for modern browsers using JavaScript and HTML5 Canvas.
