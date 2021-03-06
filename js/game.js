var Game = function() { 
	
	this.canvas;
	this.buffer;
	this.context;
	this.HEIGHT;
	this.WIDTH;
	this._canvasContext = null;
	this.FPS = 50;
	var interval = 0;
	var spawnInterval;

	this.canvas = document.getElementById("canvas");
	this.buffer = document.getElementById("buffer-canvas");

	this.buffer.width = this.canvas.width;
	this.buffer.height = this.canvas.height;

	this.context = this.canvas.getContext("2d");
	this._canvasContext = this.buffer.getContext("2d");

	this.HEIGHT = this.canvas.height;
	this.WIDTH = this.canvas.width;

	// Events
	$("#canvas").mousedown($.proxy(this.clickEvent, this));
	$(".createTowerButton").click($.proxy(this.initAddTower, this));
	$(".startGameButton").click($.proxy(this.start, this));
	$(document).keydown($.proxy(this.keyEvents, this));

	this.drawNewTower = false;										
	this.towerTypes = [ // name, costs, radius, range, lives, shootInterval, bulletPower
											['normal', 100, 10, 60, 2, "#111111", 1, 0.5], 
											['long', 150, 15, 100, 1, "#00111F", 2, 0.2],
											['heavy', 200, 20, 50, 4, "#222222", 2, 1] 
										];
	this.newTowerType;
	this.m = null;

	this.activeUnit = null;

	this.start();
};

// Init canvas and the game
Game.prototype.start = function() {
	var that = this;

	this.base = null;
	this.towers = [];
	this.enemies = [];
	this.player = null;

	this.base = new Base(this._canvasContext, this.WIDTH, this.HEIGHT);
	this.player = new Player(1, 1250);

	this.isDisplayRange = false;

	interval 			= window.setInterval(function() { that.draw() }, 1000 / this.FPS);
	spawnInterval = window.setInterval(function() { that.createEnemy() }, 4000);
};

// Draw
Game.prototype.draw = function() {
	var that = this;
	this.clearCanvas();
	
	// Draw VIP
	this.base.draw();

	// Draw Towers
	this.towers.forEach(function(tower) {
		if(tower.lives > 0) {
			tower.draw();
			// Bullets
			tower.bullets.forEach(function(bullet) {
				if( that.isColliding(bullet.bulletCollisionShape, tower.rangeCollisionShape) && bullet.isVisible)								  
						bullet.draw();
			});
		}
	});
	
	// Draw Enemies
	this.enemies.forEach(function(enemy) {
		enemy.draw();
	});

	// Update game
	this.update();

	if(this.drawNewTower)
		this.m.draw();

	this.context.drawImage(this.buffer, 0, 0);	
};

// Update Game
Game.prototype.update = function() {
	this.checkCollision();

	if(this.base.lives <= 0)
		this.stop();
}

//
Game.prototype.clearCanvas = function() {
	this.canvas.width = this.WIDTH; // Dont like this solution
	this._canvasContext.clearRect(0, 0, this.WIDTH, this.HEIGHT);
};

// Stop Game
Game.prototype.stop = function() {
    clearInterval(interval);
    clearInterval(spawnInterval);
    interval = 0;
};

// Check object collision
Game.prototype.checkCollision = function() {
	var base 		= this.base;
	var towers 	= this.towers;
	var that 		= this;
  var player 	= this.player;
  // Enemy collision detection
  this.enemies.forEach(function(enemy) {
  	if(enemy.isVisible) {
  		
  		// Collision with base
			if(that.isColliding(enemy.enemyShape, base)) {
				enemy.remove(); // TODO: remove from enemies-array
				base.setDamage();
			}

			// Tower
			towers.forEach(function(tower) {
				if(tower.lives>0) {

					// Collision with tower bullet
					tower.bullets.forEach(function(bullet) {
						if(bullet.isVisible) {
							if(that.isColliding(bullet.bulletCollisionShape, enemy.enemyShape)) {
								enemy.decreaseLive(tower.bulletPower);
								if(enemy.lives <= 0)
									player.addMoney(enemy.money);
								bullet.remove();	
							}
						}
					});

					// Collision with tower
					if(that.isColliding(enemy.enemyShape, tower.collisionShape)) {
						enemy.remove(); // TODO: remove from enemies-array
					 	tower.setDamage();
					}

					// Collision with tower range
					if(that.isColliding(enemy.enemyShape, tower.rangeCollisionShape))
						tower.shoot(enemy.enemyShape.x, enemy.enemyShape.y);
				}
			});
		}
	});
};

// ------------------------------------------------------
// EVENTS

// on canvas click event
Game.prototype.clickEvent = function(e) {
	
	var x = this.getMousePosition(e)[0];
	var y = this.getMousePosition(e)[1];
	
	/*
	console.log(this.activeUnit);
	if(this.activeUnit != null) {
		this.activeUnit.moveTo(x, y);
		this.activeUnit = null;
	}

	var activeUnit = null;
	*/
	// Check onClick Towers
	this.towers.forEach(function(tower) {
		if(	x >= tower.collisionShape.x && 
				x <= (tower.collisionShape.x + tower.collisionShape.width) && 
				y >= tower.collisionShape.y &&
				y <= tower.collisionShape.y + tower.collisionShape.height) {
			tower.clickEvent();
			//activeUnit = tower;
		}
	});
	//this.activeUnit = activeUnit;

		// Check onClick Towers
	this.enemies.forEach(function(enemy) {
		if(	x >= enemy.enemyShape.x && 
				x <= (enemy.enemyShape.x + enemy.enemyShape.width) && 
				y >= enemy.enemyShape.y &&
				y <= enemy.enemyShape.y + enemy.enemyShape.height)
			enemy.clickEvent();
	});
}

// KeyEvents
Game.prototype.keyEvents = function(e) {
	
	//console.log(e.keyCode);
	switch(e.keyCode) {
		case(82):
			this.toggleTowerRanges(); break;
	}


}

// ------------------------------------------------------
// Create Enemy
Game.prototype.createEnemy = function() {
	
	var plusMinus = this.getRandomNumber(0,3);

	if(plusMinus == 0) {
		var randomX = this.getRandomNumber(0, this.WIDTH) - this.WIDTH;
		var randomY = this.getRandomNumber(0, this.HEIGHT) - this.HEIGHT;
	} else if(plusMinus == 1) {
		var randomX = this.getRandomNumber(0, this.WIDTH) + this.WIDTH;
		var randomY = this.getRandomNumber(0, this.HEIGHT) - this.HEIGHT;
	} else if(plusMinus == 2) {
		var randomX = this.getRandomNumber(0, this.WIDTH) - this.WIDTH;
		var randomY = this.getRandomNumber(0, this.HEIGHT) + this.HEIGHT;
	} else {
		var randomX = this.getRandomNumber(0, this.WIDTH) + this.WIDTH;
		var randomY = this.getRandomNumber(0, this.HEIGHT) + this.HEIGHT;
	}
	this.enemies.push(new Enemy(this._canvasContext, randomX, randomY, this.base.x + (this.base.width / 2), this.base.y  + (this.base.height / 2)));
}

// ------------------------------------------------------
// Create Tower
Game.prototype.initAddTower = function(e) {
	if(this.player.money - 100 < 0) return false;

	this.newTowerType = e.currentTarget.id;

	this.drawNewTower = true;
	this.m = new Circle(this._canvasContext, e.pageX, e.pageY, 25, 'rgba(17, 17, 17, 0.8)');
	$("#canvas").mousemove($.proxy(this.bindTowerToMouse, this));	
	$("#canvas").mousedown($.proxy(this.createTower, this));
};
Game.prototype.bindTowerToMouse = function(e) {	
	if(this.drawNewTower) {		
		this.m.x = this.getMousePosition(e)[0];// e.pageX - $("canvas").offset().left;
		this.m.y = this.getMousePosition(e)[1]; //e.pageY - $("canvas").offset().top;		
	}
}
Game.prototype.createTower = function(e) {
	var newTowerObject = null;

	if(this.newTowerType == "long")
		newTowerObject = new TowerLong(this._canvasContext, this.getMousePosition(e)[0], this.getMousePosition(e)[1]);
	else if(this.newTowerType == "heavy")
		newTowerObject = new TowerHeavy(this._canvasContext, this.getMousePosition(e)[0], this.getMousePosition(e)[1]);
	else
		newTowerObject = new TowerNormal(this._canvasContext, this.getMousePosition(e)[0], this.getMousePosition(e)[1]);

	this.towers.push(newTowerObject);
	this.player.reduceMoney(newTowerObject.costs);
	// Clean
	e.stopPropagation();
	this.drawNewTower = false;	
	this.newTowerType = 0;
	$("#canvas").unbind("mousemove", this.createTower);
	$("#canvas").unbind("mousedown", this.createTower);
};

// Toggle show ranges of tower
Game.prototype.toggleTowerRanges = function() {
	var show = !this.isDisplayRange;
	this.towers.forEach(function(tower) {		
			tower.isDisplayRange = show;
	});
	this.isDisplayRange = !this.isDisplayRange;
}

// ------------------------------------------------------
// HELPERS

// Return a random number between min and max
Game.prototype.getRandomNumber = function( min, max ) {
	if( min > max )
		return( -1 );
	if( min == max )
		return( min );

	return( min + parseInt( Math.random() * ( max-min+1 ) ) );
};

// Returns current mouseposition
Game.prototype.getMousePosition = function(e) {
	var x, y;
	
	if (e.pageX || e.pageY) {
  	x = e.pageX; y = e.pageY;
	}	else { 
  	x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
  	y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
	}
	x -= $("canvas").offset().left;
	y -= $("canvas").offset().top;
	return [x,y];
};

// Returns true if object1 is in object2 (Rectangle)
Game.prototype.isColliding = function(obj1, obj2) {
	if(	obj1.x > obj2.x &&
			obj1.x < (obj2.x + obj2.width) &&
			obj1.y > obj2.y &&
			obj1.y < ( obj2.y +  obj2.height) )	{
				return true;
			}
	return false;
}