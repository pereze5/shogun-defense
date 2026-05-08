# Shogun Defense

A feudal Japan–themed mini-game built on top of Hakim El Hattab’s original **Core** canvas game. Defend your position on the riverbank by guiding a samurai guard, deflecting incoming attacks, and collecting vital supplies during the chaos of battle.

The game has been reworked from the original Death Star version into a historical woodblock-inspired experience based around **Takeda Shingen’s attack on Suwa Yorishige**, drawing visual inspiration from Utagawa Kuniyoshi’s print *Takeda Shingen Destroys Suwa Yorishige in Battle*.

## Features

* **Feudal Japan Theme**: The original sci-fi setting has been transformed into a samurai battlefield inspired by Japanese woodblock prints.
* **Opening Chronicle**: A flat, centered scrolling intro crawl introduces the historical setting, battle context, and gameplay objective.
* **Samurai Player Character**: The original abstract core has been replaced with a samurai PNG character.
* **Themed Projectiles and Pickups**:
  * Enemy objects are styled as incoming battlefield attacks.
  * Energy objects act as supplies or reinforcements that restore strength.
* **HUD & UI**: Dynamic status display showing score, time, and FPS, with separate start, win, and game-over states.
* **Win/Lose Logic**:
  * Lose when your energy drops to zero.
  * Win when you reach the score threshold.
  * Losing reveals a **Restart** button.
  * Winning reveals a **prize PDF link**.
* **Audio**:
  * Menu music begins after user interaction to comply with browser autoplay rules.
  * Game music starts when the battle begins and pauses when the game ends.

## Play Online

https://pereze5.github.io/shogun-defense/

## Installation

1. Clone the repository:

```bash
   git clone https://github.com/pereze5/shogun-defense.git
````

2. Open `index.html` in your browser.

3. Ensure the following assets are present:

   ```text
   assets/menu.mp3
   assets/game.mp3
   assets/prize.pdf
   images/samurai.png
   images/takeda-shingen-suwa-yorishige-kuniyoshi.jpg
   ```

## Usage

* Click anywhere on the intro screen to enable menu music.
* Click **Begin Battle** to start the game.
* Move your mouse or finger to rotate the samurai’s guard.
* Hold **SPACE** to widen your defensive stance.
* Deflect incoming attacks before they reach your position.
* Collect supply objects to restore energy.
* Reach the score threshold to win and reveal the prize PDF.

## Project Structure

```text
shogun-defense/
├── assets/
│   ├── game.mp3
│   ├── menu.mp3
│   └── prize.pdf
├── css/
│   ├── main.css
│   └── reset.css
├── images/
│   ├── samurai.png
│   └── takeda-shingen-suwa-yorishige-kuniyoshi.jpg
├── js/
│   ├── core.js
│   ├── core-audio.js
│   └── timbre.js
└── index.html
```

## Customization

* Change the score threshold in `js/core.js`.
* Swap `images/samurai.png` to use a different player character.
* Replace `assets/menu.mp3` or `assets/game.mp3` to change the soundtrack.
* Replace `assets/prize.pdf` to change the win reward.
* Adjust colours, fonts, crawl speed, and background treatment in `css/main.css`.

## Credits

This project is based on the original **Core** canvas game by [Hakim El Hattab](http://hakim.se).

Historical and visual inspiration comes from Utagawa Kuniyoshi’s depiction of **Takeda Shingen destroying Suwa Yorishige’s camp in battle**.

## License

This project is MIT-licensed, following the original license of Hakim El Hattab’s **Core** game. Feel free to modify, experiment, and share.

```

