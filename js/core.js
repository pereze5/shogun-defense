/**
 * Core
 * MIT licensed
 *
 * Copyright (C) 2018 Hakim El Hattab, http://hakim.se
 */
var Core = new function(){

	// Flags if we are running mobile mode
	var isMobile = !!navigator.userAgent.toLowerCase().match( /ipod|ipad|iphone|android/gi );

	var DEFAULT_WIDTH = 1000,
		DEFAULT_HEIGHT = 650,
		BORDER_WIDTH = 6,
		FRAMERATE = 60;

	// Types of organisms
	var ORGANISM_ENEMY = 'enemy',
		ORGANISM_ENERGY = 'energy';

	// The world dimensions
	var world = {
		width: isMobile ? window.innerWidth : DEFAULT_WIDTH,
		height: isMobile ? window.innerHeight : DEFAULT_HEIGHT
	};

	var canvas,
		context;

	var canvasBackground,
		contextBackground;

	// UI DOM elements
	var status;
	var panels;
	var message;
	var title;
	var startButton;
	var gameOverPanel;
	var gameOverTitle;
	var gameOverMessage;
	var restartButton;
	var winLink;

	// Game elements
	var organisms = [];
	var particles = [];
	var player;

	// Mouse properties
	var mouseX = (window.innerWidth + world.width) * 0.5;
	var mouseY = (window.innerHeight + world.height) * 0.5;
	var mouseIsDown = false;
	var spaceIsDown = false;

	// Game properties and scoring
	var playing = false;
	var score = 0;
	var time = 0;
	var duration = 0;
	var difficulty = 1;
	var lastspawn = 0;

	// Game statistics
	var fc = 0; // Frame count
	var fs = 0; // Frame score
	var cs = 0; // Collision score

	// The world's velocity
	var velocity = { x: -1.3, y: 1 };

	// Performance (FPS) tracking
	var fps = 0;
	var fpsMin = 1000;
	var fpsMax = 0;
	var timeLastSecond = new Date().getTime();
	var frames = 0;

	var menuMusic = new Audio('assets/menu.mp3');
	var gameMusic = new Audio('assets/game.mp3');

	var samuraiImage = new Image();
	samuraiImage.src = 'images/samurai.png';

	this.init = function(){

		canvas = document.getElementById('world');
		canvasBackground = document.getElementById('background');
		panels = document.getElementById('panels');
		status = document.getElementById('status');
		message = document.getElementById('message');
		title = document.getElementById('title');
		startButton = document.getElementById('startButton');
		gameOverPanel = document.getElementById('gameOver');
		gameOverTitle = document.getElementById('gameOverTitle');
		gameOverMessage = document.getElementById('gameOverMessage');
		restartButton = document.getElementById('restartButton');
		winLink = document.getElementById('winLink');

		restartButton.addEventListener('click', startButtonClickHandler, false);

		if (canvas && canvas.getContext) {
			context = canvas.getContext('2d');
			contextBackground = canvasBackground.getContext('2d');

			// Register event listeners
			document.addEventListener('mousemove', documentMouseMoveHandler, false);
			document.addEventListener('mousedown', documentMouseDownHandler, false);
			document.addEventListener('mouseup', documentMouseUpHandler, false);
			canvas.addEventListener('touchstart', documentTouchStartHandler, false);
			document.addEventListener('touchmove', documentTouchMoveHandler, false);
			document.addEventListener('touchend', documentTouchEndHandler, false);
			window.addEventListener('resize', windowResizeHandler, false);
			startButton.addEventListener('click', startButtonClickHandler, false);
			document.addEventListener('keydown', documentKeyDownHandler, false);
			document.addEventListener('keyup', documentKeyUpHandler, false);

			// Define our player
			player = new Player();

			// Force an initial resize to make sure the UI is sized correctly
			windowResizeHandler();

			// If we are running on mobile, certain elements need to be configured differently
			if( isMobile ) {
				status.style.width = world.width + 'px';
				canvas.style.border = 'none';
			}

			// Configure looping & volume
			menuMusic.loop = true;
			menuMusic.volume = 0.4;
			gameMusic.loop = true;
			gameMusic.volume = 0.4;

			// Start the menu track after first user click on the intro panel
			panels.addEventListener('click', function once() {
				menuMusic.play();
				panels.removeEventListener('click', once);
			});

			animate();
		}
	};

	function renderBackground() {
		// var gradient = …;
		// gradient.addColorStop(…);
		// contextBackground.fillStyle = gradient;
		// contextBackground.fillRect(0, 0, world.width, world.height);
	}

	/**
	 * Handles click on the start button in the UI.
	 */
	function startButtonClickHandler(event) {
		// Stop menu, start game track
		menuMusic.pause();
		gameMusic.currentTime = 0;
		gameMusic.play();

		// Always hide the Game-Over overlay, in case it was showing
		gameOverPanel.style.display = 'none';

		// Only kick off a new game if we are not already playing
		if( !playing ) {
			playing = true;

			// Reset game properties
			organisms = [];
			score = 0;
			difficulty = 1;

			// Reset game tracking properties
			fc = 0;
			fs = 0;
			cs = 0;

			// Reset the player data
			player.energy = 30;
			player.energyRadius = 0;
			player.energyRadiusTarget = 0;

			// Show/hide the right UI
			panels.style.display = 'none';
			status.style.display = 'block';

			// Start the timer
			time = Date.now();
		}
	}

	/**
	 * Stops the currently ongoing game and shows the
	 * resulting data in the UI.
	 */
	function gameOver() {
		playing = false;

		// Hide the crawl/canvas UI
		panels.style.display = 'none';
		status.style.display = 'none';

		// Show just the Game-Over overlay
		gameOverPanel.style.display = 'block';

		// Fill in the bits
		gameOverTitle.textContent = 'Game Over';
		gameOverMessage.textContent = 'You scored ' + Math.round(score) + ' points';

		gameMusic.pause();
	}

	function documentKeyDownHandler(event) {
		switch( event.keyCode ) {
			case 32:
				if( !spaceIsDown && player.energy > 15 ) {
					player.energy -= 4;
				}
				spaceIsDown = true;
				event.preventDefault();
				break;
		}
	}

	function documentKeyUpHandler(event) {
		switch( event.keyCode ) {
			case 32:
				spaceIsDown = false;
				event.preventDefault();
				break;
		}
	}

	/**
	 * Event handler for document.onmousemove.
	 */
	function documentMouseMoveHandler(event){
		mouseX = event.clientX - (window.innerWidth - world.width) * 0.5 - BORDER_WIDTH;
		mouseY = event.clientY - (window.innerHeight - world.height) * 0.5 - BORDER_WIDTH;
	}

	/**
	 * Event handler for document.onmousedown.
	 */
	function documentMouseDownHandler(event){
		mouseIsDown = true;
	}

	/**
	 * Event handler for document.onmouseup.
	 */
	function documentMouseUpHandler(event) {
		mouseIsDown = false;
	}

	/**
	 * Event handler for document.ontouchstart.
	 */
	function documentTouchStartHandler(event) {
		if(event.touches.length == 1) {
			event.preventDefault();

			mouseX = event.touches[0].pageX - (window.innerWidth - world.width) * 0.5;
			mouseY = event.touches[0].pageY - (window.innerHeight - world.height) * 0.5;

			mouseIsDown = true;
		}
	}

	/**
	 * Event handler for document.ontouchmove.
	 */
	function documentTouchMoveHandler(event) {
		if(event.touches.length == 1) {
			event.preventDefault();

			mouseX = event.touches[0].pageX - (window.innerWidth - world.width) * 0.5 - 60;
			mouseY = event.touches[0].pageY - (window.innerHeight - world.height) * 0.5 - 30;
		}
	}

	/**
	 * Event handler for document.ontouchend.
	 */
	function documentTouchEndHandler(event) {
		mouseIsDown = false;
	}

	/**
	 * Event handler for window.onresize.
	 */
	function windowResizeHandler() {
		// Update the game size
		world.width = isMobile ? window.innerWidth : DEFAULT_WIDTH;
		world.height = isMobile ? window.innerHeight : DEFAULT_HEIGHT;

		// Center the player
		player.position.x = world.width * 0.5;
		player.position.y = world.height * 0.5;

		// Resize the canvas
		canvas.width = world.width;
		canvas.height = world.height;
		canvasBackground.width = world.width;
		canvasBackground.height = world.height;

		// Determine the x/y position of the canvas
		var cvx = (window.innerWidth - world.width) * 0.5;
		var cvy = (window.innerHeight - world.height) * 0.5;

		// Position the canvas
		canvas.style.position = 'absolute';
		canvas.style.left = cvx + 'px';
		canvas.style.top = cvy + 'px';

		canvasBackground.style.position = 'absolute';
		canvasBackground.style.left = cvx + BORDER_WIDTH + 'px';
		canvasBackground.style.top = cvy + BORDER_WIDTH + 'px';

		if( isMobile ) {
			panels.style.left = '0px';
			panels.style.top = '0px';
			panels.style.width = '100%';
			panels.style.height = '100%';

			status.style.left = '0px';
			status.style.top = '0px';
		}
		else {
			panels.style.left = cvx + BORDER_WIDTH + 'px';
			panels.style.top = cvy + BORDER_WIDTH + 'px';
			panels.style.width = world.width + 'px';
			panels.style.height = world.height + 'px';

			status.style.left = cvx + BORDER_WIDTH + 'px';
			status.style.top = cvy + BORDER_WIDTH + 'px';
		}

		// renderBackground();
	}

	/**
	 * Emits a random number of particles from a set point.
	 *
	 * @param position The point where particles will be emitted from
	 * @param spread The pixel spread of the emittal
	 */
	function emitParticles( position, direction, spread, seed ) {
		var q = seed + ( Math.random() * seed );

		while( --q >= 0 ) {
			var p = new Point();

			p.position.x = position.x + ( Math.sin(q) * spread );
			p.position.y = position.y + ( Math.cos(q) * spread );
			p.velocity = {
				x: direction.x + ( -1 + Math.random() * 2 ),
				y: direction.y + ( -1 + Math.random() * 2 )
			};
			p.alpha = 1;

			particles.push( p );
		}
	}

	/**
	 * Draws the player as a samurai PNG sprite.
	 */
	function drawSamurai(x, y, angle) {
		context.save();

		// Move origin to player position
		context.translate(x, y);

		// Rotate sprite to face the same direction as the shield/aim
		context.rotate(angle + Math.PI / 2);

		// Sprite size on canvas
		var spriteWidth = 84;
		var spriteHeight = 84;

		// Draw centered on the player position
		if( samuraiImage.complete ) {
			context.drawImage(
				samuraiImage,
				-spriteWidth * 0.5,
				-spriteHeight * 0.5,
				spriteWidth,
				spriteHeight
			);
		}
		else {
			// Fallback marker while the image is loading
			context.beginPath();
			context.fillStyle = '#6e1f1f';
			context.arc(0, 0, 18, 0, Math.PI * 2, true);
			context.fill();
		}

		context.restore();
	}

	/**
	 * Draws enemies and energy pickups with themed visuals.
	 * Enemies become arrows/projectiles.
	 * Energy pickups become supply crests.
	 */
	function drawOrganism(p) {
		var angle = Math.atan2(p.velocity.y, p.velocity.x);

		context.save();
		context.translate(p.position.x, p.position.y);
		context.rotate(angle);

		if( p.type == ORGANISM_ENEMY ) {
			var alpha = p.alpha;

			// Flame / motion trail
			context.beginPath();
			context.fillStyle = 'rgba(180, 40, 20, ' + (alpha * 0.35) + ')';
			context.moveTo(-p.size * 2.4, 0);
			context.lineTo(-p.size * 0.5, -p.size * 0.55);
			context.lineTo(-p.size * 0.75, 0);
			context.lineTo(-p.size * 0.5, p.size * 0.55);
			context.closePath();
			context.fill();

			// Arrow shaft
			context.strokeStyle = 'rgba(70, 35, 15, ' + alpha + ')';
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(-p.size * 1.7, 0);
			context.lineTo(p.size * 1.15, 0);
			context.stroke();

			// Arrowhead
			context.fillStyle = 'rgba(215, 210, 190, ' + alpha + ')';
			context.beginPath();
			context.moveTo(p.size * 1.75, 0);
			context.lineTo(p.size * 0.85, -p.size * 0.55);
			context.lineTo(p.size * 1.05, 0);
			context.lineTo(p.size * 0.85, p.size * 0.55);
			context.closePath();
			context.fill();

			// Dark outline on arrowhead
			context.strokeStyle = 'rgba(45, 35, 25, ' + alpha + ')';
			context.lineWidth = 1;
			context.beginPath();
			context.moveTo(p.size * 1.75, 0);
			context.lineTo(p.size * 0.85, -p.size * 0.55);
			context.lineTo(p.size * 1.05, 0);
			context.lineTo(p.size * 0.85, p.size * 0.55);
			context.closePath();
			context.stroke();

			// Fletching top
			context.fillStyle = 'rgba(130, 25, 20, ' + alpha + ')';
			context.beginPath();
			context.moveTo(-p.size * 1.45, 0);
			context.lineTo(-p.size * 2.1, -p.size * 0.55);
			context.lineTo(-p.size * 1.15, -p.size * 0.18);
			context.closePath();
			context.fill();

			// Fletching bottom
			context.beginPath();
			context.moveTo(-p.size * 1.45, 0);
			context.lineTo(-p.size * 2.1, p.size * 0.55);
			context.lineTo(-p.size * 1.15, p.size * 0.18);
			context.closePath();
			context.fill();

			// Small glowing tip
			context.beginPath();
			context.fillStyle = 'rgba(255, 190, 80, ' + (alpha * 0.65) + ')';
			context.arc(p.size * 1.7, 0, p.size * 0.18, 0, Math.PI * 2, true);
			context.fill();
		}

		if( p.type == ORGANISM_ENERGY ) {
			var radius = p.size * 0.65;

			// Outer supply token
			context.beginPath();
			context.fillStyle = 'rgba(48, 142, 95, ' + p.alpha + ')';
			context.arc(0, 0, radius, 0, Math.PI * 2, true);
			context.fill();

			context.strokeStyle = 'rgba(214, 168, 79, ' + p.alpha + ')';
			context.lineWidth = 2;
			context.stroke();

			// Inner pale disk
			context.beginPath();
			context.fillStyle = 'rgba(245, 225, 180, ' + (p.alpha * 0.35) + ')';
			context.arc(0, 0, radius * 0.58, 0, Math.PI * 2, true);
			context.fill();

			// Clan/supply crest mark
			context.beginPath();
			context.strokeStyle = 'rgba(245, 225, 180, ' + p.alpha + ')';
			context.lineWidth = 2;
			context.moveTo(0, -radius * 0.62);
			context.lineTo(0, radius * 0.62);
			context.moveTo(-radius * 0.62, 0);
			context.lineTo(radius * 0.62, 0);
			context.stroke();

			// Small centre point
			context.beginPath();
			context.fillStyle = 'rgba(214, 168, 79, ' + p.alpha + ')';
			context.arc(0, 0, radius * 0.18, 0, Math.PI * 2, true);
			context.fill();
		}

		context.restore();
	}

	/**
	 * Called on every frame to update the game properties
	 * and render the current state to the canvas.
	 */
	function animate() {

		// Fetch the current time for this frame
		var frameTime = new Date().getTime();

		// Increase the frame count
		frames ++;

		// Check if a second has passed since the last time we updated the FPS
		if( frameTime > timeLastSecond + 1000 ) {
			// Establish the current, minimum and maximum FPS
			fps = Math.min( Math.round( ( frames * 1000 ) / ( frameTime - timeLastSecond ) ), FRAMERATE );
			fpsMin = Math.min( fpsMin, fps );
			fpsMax = Math.max( fpsMax, fps );

			timeLastSecond = frameTime;
			frames = 0;
		}

		// A factor by which the score will be scaled, depending on current FPS
		var scoreFactor = 0.01 + ( Math.max( Math.min( fps, FRAMERATE ), 0 ) / FRAMERATE * 0.99 );

		// Scales down the factor by itself
		scoreFactor = scoreFactor * scoreFactor;

		// Clear the canvas of all old pixel data
		context.clearRect(0, 0, canvas.width, canvas.height);

		var i,
			ilen,
			j,
			jlen,
			p,
			p2;

		// Only update game properties and draw the player if a game is active
		if( playing ) {

			// Increment the difficulty slightly
			difficulty += 0.0015;

			// Increment the score depending on difficulty
			score += (0.4 * difficulty) * scoreFactor;

			// Increase the game frame count stat
			fc ++;

			// Increase the score count stats
			fs += (0.4 * difficulty) * scoreFactor;

			var targetAngle = Math.atan2( mouseY - player.position.y, mouseX - player.position.x );

			if( Math.abs( targetAngle - player.angle ) > Math.PI ) {
				player.angle = targetAngle;
			}

			player.angle += ( targetAngle - player.angle ) * 0.2;

			player.energyRadiusTarget = ( player.energy / 100 ) * ( player.radius * 0.8 );
			player.energyRadius += ( player.energyRadiusTarget - player.energyRadius ) * 0.2;

			player.shield = {
				x: player.position.x + Math.cos( player.angle ) * player.radius,
				y: player.position.y + Math.sin( player.angle ) * player.radius
			};

			// Defensive arc / guard range
			context.beginPath();
			context.strokeStyle = '#d6a84f';
			context.lineWidth = 3;
			context.arc(
				player.position.x,
				player.position.y,
				player.radius,
				player.angle + 1.6,
				player.angle - 1.6,
				true
			);
			context.stroke();

			// Samurai player character
			drawSamurai(player.position.x, player.position.y, player.angle);
		}

		if( spaceIsDown && player.energy > 10 ) {
			player.energy -= 0.1;

			context.beginPath();
			context.strokeStyle = '#d6a84f';
			context.lineWidth = 1;
			context.fillStyle = 'rgba( 110, 31, 31, ' + ( player.energy / 100 ) * 0.45 + ' )';
			context.arc( player.position.x, player.position.y, player.radius, 0, Math.PI * 2, true );
			context.fill();
			context.stroke();

			// play sound for the shield
			CoreAudio.playShield();
		}

		var enemyCount = 0;
		var energyCount = 0;

		// Go through each enemy and draw it + update its properties
		for( i = 0; i < organisms.length; i++ ) {
			p = organisms[i];

			p.position.x += p.velocity.x;
			p.position.y += p.velocity.y;

			p.alpha += ( 1 - p.alpha ) * 0.1;

			drawOrganism(p);

			var angle = Math.atan2( p.position.y - player.position.y, p.position.x - player.position.x );

			if( playing ) {

				var dist = Math.abs( angle - player.angle );

				if( dist > Math.PI ) {
					dist = ( Math.PI * 2 ) - dist;
				}

				if( dist < 1.6 ) {
					if( p.distanceTo(player.position) > player.radius - 5 && p.distanceTo(player.position) < player.radius + 5 ) {
						p.dead = true;

						// play sound
						CoreAudio.organismDead();
					}
				}

				if( spaceIsDown && p.distanceTo(player.position) < player.radius && player.energy > 11 ) {
					p.dead = true;
					score += 4;
				}

				if( p.distanceTo(player.position) < player.energyRadius + (p.size * 0.5) ) {
					if( p.type == ORGANISM_ENEMY ) {
						player.energy -= 6;

						// play sound
						CoreAudio.energyDown();
					}

					if( p.type == ORGANISM_ENERGY ) {
						player.energy += 8;
						score += 30;

						// play sound
						CoreAudio.energyUp();
					}

					player.energy = Math.max(Math.min(player.energy, 100), 0);

					p.dead = true;
				}
			}

			// If the enemy is outside of the game bounds, destroy it
			if(
				p.position.x < -p.size ||
				p.position.x > world.width + p.size ||
				p.position.y < -p.size ||
				p.position.y > world.height + p.size
			) {
				p.dead = true;
			}

			// If the enemy is dead, remove it
			if( p.dead ) {
				emitParticles(
					p.position,
					{
						x: (p.position.x - player.position.x) * 0.02,
						y: (p.position.y - player.position.y) * 0.02
					},
					5,
					5
				);

				organisms.splice( i, 1 );
				i --;
			}
			else {
				if( p.type == ORGANISM_ENEMY ) enemyCount ++;
				if( p.type == ORGANISM_ENERGY ) energyCount ++;
			}
		}

		// If there are less enemies than intended for this difficulty, add another one
		if( enemyCount < 1 * difficulty && new Date().getTime() - lastspawn > 100 ) {
			organisms.push( giveLife( new Enemy() ) );
			lastspawn = new Date().getTime();
		}

		// If there are no energy pickups, sometimes add one
		if( energyCount < 1 && Math.random() > 0.996 ) {
			organisms.push( giveLife( new Energy() ) );
		}

		// Go through and draw all particle effects
		for( i = 0; i < particles.length; i++ ) {
			p = particles[i];

			// Apply velocity to the particle
			p.position.x += p.velocity.x;
			p.position.y += p.velocity.y;

			// Fade out
			p.alpha -= 0.02;

			// Draw the particle
			context.fillStyle = 'rgba(255,255,255,' + Math.max(p.alpha, 0) + ')';
			context.fillRect( p.position.x, p.position.y, 1, 1 );

			// If the particle is faded out to less than zero, remove it
			if( p.alpha <= 0 ) {
				particles.splice( i, 1 );
			}
		}

		// If the game is active, update the game status bar with score, duration and FPS
		if( playing ) {
			var scoreText = 'Score: <span>' + Math.round( score ) + '</span>';
			scoreText += ' Time: <span>' + Math.round( ( ( new Date().getTime() - time ) / 1000 ) * 100 ) / 100 + 's</span>';
			scoreText += ' <p class="fps">FPS: <span>' + Math.round( fps ) + ' (' + Math.round(Math.max(Math.min(fps / FRAMERATE, FRAMERATE), 0) * 100) + '%)</span></p>';

			status.innerHTML = scoreText;

			// 1) WIN?
			if( score >= 3000 && playing ) {
				playing = false;

				panels.style.display = 'none';
				status.style.display = 'none';

				gameOverPanel.style.display = 'block';
				gameOverTitle.textContent = 'You Win!';
				gameOverMessage.textContent = 'Congratulations—you reached ' + Math.round(score) + ' points!';

				// swap UI controls
				gameMusic.pause();
				restartButton.style.display = 'none';
				winLink.style.display = 'inline-block';

				return;
			}

			// 2) LOSE?
			if( player.energy === 0 ) {
				emitParticles( player.position, { x: 0, y: 0 }, 10, 40 );

				gameOver();

				CoreAudio.playGameOver();
				gameMusic.pause();

				// swap UI controls
				restartButton.style.display = '';
				winLink.style.display = 'none';
			}
		}

		requestAnimFrame( animate );
	}

	/**
	 *
	 */
	function giveLife( organism ) {
		var side = Math.round( Math.random() * 3 );

		switch( side ) {
			case 0:
				organism.position.x = 10;
				organism.position.y = world.height * Math.random();
				break;

			case 1:
				organism.position.x = world.width * Math.random();
				organism.position.y = 10;
				break;

			case 2:
				organism.position.x = world.width - 10;
				organism.position.y = world.height * Math.random();
				break;

			case 3:
				organism.position.x = world.width * Math.random();
				organism.position.y = world.height - 10;
				break;
		}

		if( playing ) {
			CoreAudio.playSynth( organism.position.x / world.width );
		}

		organism.speed = Math.min( Math.max( Math.random(), 0.6 ), 0.75 );

		organism.velocity.x = ( player.position.x - organism.position.x ) * 0.006 * organism.speed;
		organism.velocity.y = ( player.position.y - organism.position.y ) * 0.006 * organism.speed;

		if( organism.type == 'enemy' ) {
			organism.velocity.x *= (1 + (Math.random() * 0.1));
			organism.velocity.y *= (1 + (Math.random() * 0.1));
		}

		organism.alpha = 0;

		return organism;
	}

};

function Point( x, y ) {
	this.position = { x: x, y: y };
}

Point.prototype.distanceTo = function(p) {
	var dx = p.x - this.position.x;
	var dy = p.y - this.position.y;

	return Math.sqrt(dx * dx + dy * dy);
};

Point.prototype.clonePosition = function() {
	return {
		x: this.position.x,
		y: this.position.y
	};
};

function Player() {
	this.position = { x: 0, y: 0 };
	this.length = 15;
	this.energy = 30;
	this.energyRadius = 0;
	this.energyRadiusTarget = 0;
	this.radius = 60;
	this.angle = 0;
	this.coreQuality = 16;
	this.coreNodes = [];
}

Player.prototype = new Point();

Player.prototype.updateCore = function() {
	var i, j, n;

	if( this.coreNodes.length == 0 ) {
		for( i = 0; i < this.coreQuality; i++ ) {
			n = {
				position: { x: this.position.x, y: this.position.y },
				normal: { x: 0, y: 0 },
				normalTarget: { x: 0, y: 0 },
				offset: { x: 0, y: 0 }
			};

			this.coreNodes.push( n );
		}
	}

	for( i = 0; i < this.coreQuality; i++ ) {
		n = this.coreNodes[i];

		var angle = ( i / this.coreQuality ) * Math.PI * 2;

		n.normal.x = Math.cos( angle ) * this.energyRadius;
		n.normal.y = Math.sin( angle ) * this.energyRadius;

		n.offset.x = Math.random() * 5;
		n.offset.y = Math.random() * 5;
	}
};

function Enemy() {
	this.position = { x: 0, y: 0 };
	this.velocity = { x: 0, y: 0 };
	this.size = 6 + ( Math.random() * 4 );
	this.speed = 1;
	this.type = 'enemy';
}

Enemy.prototype = new Point();

function Energy() {
	this.position = { x: 0, y: 0 };
	this.velocity = { x: 0, y: 0 };
	this.size = 10 + ( Math.random() * 6 );
	this.speed = 1;
	this.type = 'energy';
}

Energy.prototype = new Point();

// shim with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame       ||
		   window.webkitRequestAnimationFrame ||
		   window.mozRequestAnimationFrame    ||
		   window.oRequestAnimationFrame      ||
		   window.msRequestAnimationFrame     ||
		   function(/* function */ callback, /* DOMElement */ element){
			   window.setTimeout(callback, 1000 / 60);
		   };
})();

Core.init();
