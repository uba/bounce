/**
 * Encapsulates the main logic of the Bounce game.
 * @author Douglas Uba
 * Inspired by work of Hakim El Hattab (https://hakim.se/).
 */
var Bounce = (function() {
    // Fade effect for menu item
    var MENU_FADE_IN_DURATION = 300,
        MENU_FADE_OUT_DURATION = 600;

    // Default dimensions of the world
    var DEFAULT_WIDTH = 600,
        DEFAULT_HEIGHT = 400;

    // The world dimensions
    var world = {
        width : DEFAULT_WIDTH,
        height : DEFAULT_HEIGHT
    };

    // Bounce Animation - quadratic function parameters
    var a = 0.1;
    var c = world.height * 0.3;
    var xIt = 0;
    var step = 2;
    var direction = 1;
    var quadf = QuadraticFunction(a, 0, c);

    // Canvas and 2D context
    var canvas;
    var context;
    var fadeFactor = 1.0;

    // DOM elements
    var game;
    var menu;
    var scorePanel, highscorePanel;

    // Game state
    var playing = false;
    var score = 0;

    // Game elements
    var player;
    var enemies = [];
    var particles = [];
    var notifications = [];
    
    // HUD
    var scoreDisplay = {
        label : 'Score:',
        font : 'bold 16px Verdana',
        color : '#ffffff',
        x : 5,
        y : 18
    }
    
    // Sounds Effects
    var sfx = {
        intro: new Howl({
            src: ['assets/intro.mp3'],
            autoplay: true,
            loop: true
        }),
        dead: new Howl({
            src: ['assets/dead.mp3']
        }),
        ping: new Howl({
            src: ['assets/ping.mp3']
        }),
        bounce: new Howl({
            src: ['assets/bounce.mp3']
        }),
        start: new Howl({
            src: ['assets/start.wav']
        }),
        background: new Howl({
            src: ['assets/background.mp3'],
            loop: true
        })
    };

    // Change global volume.
    Howler.volume(0.5);

    // Sounds control
    var soundEnabled = true;
    $('#soundButton').click(function(e) {
        e.stopImmediatePropagation();
        Howler.mute(soundEnabled);
        soundEnabled = !soundEnabled;
        this.innerHTML = soundEnabled ? '<i class="fa fa-volume-up" aria-hidden="true"></i>': 
            '<i class="fa fa-volume-off" aria-hidden="true"></i>';
    });
    
    function load() {
        var sounds = 0;
        for(let sound in sfx) {
            sfx[sound].once('load', function() {
                sounds++;
                if(sounds == Object.keys(sfx).length) {
                    initialize();
                }
                
            });
        }
    }

    function initialize() {
         // Run selectors and cache elements references
         game = $('#game');
         menu = $('#menu');
         scorePanel = document.querySelector('#score');
         highscorePanel = document.querySelector('#highscore');

        if(isMobile()) { // Adjust for mobile devices
            // World & bouncing animation
            world.width = $(window).width();
            world.height = $(window).height() * 0.75;
            c = world.height * 0.3;
            quadf = QuadraticFunction(a, 0, c);

            // Controls
            $('#leftButton').on('touchstart', function(e) {
                e.preventDefault();
                if(playing) player.goingLeft = true;
            });
            $('#leftButton').on('touchend', function(e) {
                e.preventDefault();
                if(playing) player.goingLeft = false;
            });
            $('#rightButton').on('touchstart', function(e) {
                e.preventDefault();
                if(playing) player.goingRight = true;
            });
            $('#rightButton').on('touchend', function(e) {
                e.preventDefault();
                if(playing) player.goingRight = false;
            });
        }

        // Create highscore item
        const highscore = localStorage.getItem('highscore');
        if(highscore == null)
            localStorage.setItem('highscore', 0);

        // Get references to the canvas elements and their 2D contexts
        canvas = document.querySelector('#canvas');

        if(canvas && canvas.getContext) {
            // 2D context
            context = canvas.getContext('2d');

            // Force an initial layout
            onWindowResizeHandler();

            // Binding listeners
            document.addEventListener('keydown', onKeyDown, false);
            document.addEventListener('keyup', onKeyUp, false);
            menu.on('touchstart', start);
            window.addEventListener('resize', onWindowResizeHandler, false);

            game.fadeIn(MENU_FADE_IN_DURATION);
            menu.hide().delay(MENU_FADE_IN_DURATION).fadeIn(MENU_FADE_IN_DURATION);

            reset();
            update();
        }
        else alert('Your browser does not support the canvas element.');
    }

    function start() {
        if(playing) return;
        reset();
        // Sound-effects
        sfx.intro.stop();
        sfx.start.play();
        sfx.background.seek(1);
        sfx.background.play();
        // New player
        player = new Ball(world.width * 0.75, 0, 12, 4);
        // Enemies
        enemies.push(new Ball(0, world.height * 0.45, 7, 2.5, 'rgba(220, 220, 0, 0.9)'));
        enemies.push(new Ball(0, world.height - 14, 7, 2.0, 'rgba(0, 220, 0, 0.9)'));
        // Let's go!
        menu.fadeOut(MENU_FADE_OUT_DURATION);
        playing = true;
    }
    
    function stop() {
        playing = false;
        sfx.background.stop();
        sfx.intro.play();
        scorePanel.style.display = 'inline-block';
        scorePanel.querySelector('p').innerHTML = score;
        const highscore = updateHighScore();
        highscorePanel.style.display = 'inline-block';
        highscorePanel.querySelector('p').innerHTML = highscore;
        menu.fadeIn(MENU_FADE_IN_DURATION);
    }

    function updateHighScore() {
        const highscore = localStorage.getItem('highscore');
        if(score > highscore)
            localStorage.setItem('highscore', score);
        return localStorage.getItem('highscore')
    }
    
    function reset() {
        playing = false;
        player = null;
        enemies = [];
        particles = [];
        notifications = [];
        score = 0;
        xIt = 0;
        direction = 1;
    }

    function update() {
        context.fillStyle = 'rgba(0, 0, 0,' + fadeFactor + ')';
        context.fillRect( 0 , 0 , canvas.width , canvas.height);
        context.save();
        if(playing) {
            updatePlayer();
            updateEnemies();
            findIntersections();
            renderPlayer();
            renderEnemies();
            renderHUD();
        }
        updateParticles();
        renderParticles();
        renderNotifications();
        context.restore();
        requestAnimFrame(update); // loop
    }

    function findIntersections() {
        var i = enemies.length;
        while(i--) {
            var enemy = enemies[i];
            if(player.intersects(enemy)) {
                emitParticles(player.color, player.x, player.y, 3, 6, 60);
                emitParticles(enemy.color, enemy.x, enemy.y, enemy.speed, 3, 30);
                enemies.splice(i, 1);
                stop(); // Dead!
                sfx.dead.play();
                return;
            }
        }
    }

    function emitParticles(color, x, y, speed, size, quantity) {
        while(quantity--)
            particles.push(new Particle(x, y, speed, color, size));
    }

    function notify(text, x, y, scale, rgb) {
        notifications.push(new Notification(text, x, y, scale, rgb));
    }
    
    function updateScore() {
        score++; // Bounce!
        sfx.bounce.play();
        emitParticles(player.color, player.x, player.y, 3, 3, 15);
        if(score % 10 == 0) {
            notify(score, player.x, player.y - 70, 4.0, [0, 220, 220]);
            emitParticles(player.color, player.x, player.y - 80, 10, 5, score);
            sfx.ping.play();
        }
    }

    function updatePlayer() {
        // Calculating the new player y position - bouncing
        if(player.y > world.height - player.size) {
            direction *= -1;
            updateScore();
        }

        // Next y position
        xIt += step * direction;
        player.y = quadf(xIt);

        // Updating the player x position
        var currentx = player.x;
        if(player.goingLeft)
            player.x -= player.speed;
        if(player.goingRight)
            player.x += player.speed;

        // Checking width bounds
        if(player.x < player.size || player.x > world.width - player.size)
            player.x = currentx;
    }

    function updateEnemies() {
        var i = enemies.length;
        while(i--) {
            var enemy = enemies[i];
            enemy.goingRight ? enemy.x += enemy.speed : enemy.x -= enemy.speed;
            // Checking bounds
            if(enemy.x > world.width - enemy.size) {
                enemy.goingRight = false;
                emitParticles(enemy.color, enemy.x, enemy.y, 3, 3, 15);
                enemy.speed += 0.3;
            }
            else if(enemy.x < enemy.size) {
                enemy.goingRight = true;
                emitParticles(enemy.color, enemy.x, enemy.y, 3, 3, 15);
            }
        }
    }

    function renderPlayer() {
        renderBall(player);
    }

    function renderEnemies() {
        var i = enemies.length;
        while(i--)
            renderBall(enemies[i]);
    }

    function renderBall(b) {
        context.save();
        context.beginPath();
        context.arc(b.x, b.y, b.size, 0, 2 * Math.PI, true);
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        context.fillStyle = b.color;
        context.shadowBlur = 10;
        context.shadowColor = b.color;
        context.stroke();
        context.fill();
        context.restore();
    }

    function updateParticles() {
        var i = particles.length;
        while(i--) {
            var particle = particles[i];
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.velocity.x *= 0.98;
            particle.velocity.y *= 0.98;
            if(particle.fading == true)
                particle.alpha *= 0.92;
            else if(Math.random() > 0.92)
                particle.fading = true;
            if(particle.alpha < 0.05)
                particles.splice(i, 1);
        }
    }

    function renderParticles() {
        var i = particles.length;
        while(i--) {
            var particle = particles[i];
            context.save();
            context.globalAlpha = particle.alpha;
            context.fillStyle = particle.color;
            context.fillRect(particle.x, particle.y, particle.size, particle.size);
            context.restore();
        }
    }

    function renderNotifications() {
        var i = notifications.length;
        // Go through and draw all notification texts
        while(i--) {
            var p = notifications[i];
            // Make the text float upwards
            p.y -= 0.4;
            var r = 14 * p.scale;
            // Draw the notification
            context.save();
            context.font = 'bold ' + Math.round(12 * p.scale) + "px Arial";
            context.beginPath();
            context.fillStyle = 'rgba(0,0,0,' + (0.7 * p.alpha) + ')';
            context.arc(p.x, p.y, r, 0, Math.PI * 2, true);
            context.fill();

            context.fillStyle = "rgba( " + p.rgb[0] + ", " + p.rgb[1] + ", " + p.rgb[2] + ", " + p.alpha + " )";
            context.fillText(p.text, p.x - (context.measureText(p.text).width * 0.5), p.y + (4 * p.scale));
            context.restore();

            // Fade out
            p.alpha *= 1 - (0.08 * (1 - ((p.alpha - 0.08) / 1)));

            // If the notifaction is faded out, remove it
            if(p.alpha < 0.05)
                notifications.splice(i, 1);
            r += 2;
        }
    }
    
    function renderHUD() {
        context.save();
        // Panel
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(0, 0, world.width, 30);
        // Score label
        context.font = scoreDisplay.font;
        context.fillStyle = scoreDisplay.color;
        context.fillText(scoreDisplay.label, scoreDisplay.x, scoreDisplay.y);
        // Score value
        context.fillStyle = 'rgb(0, 220, 220)';
        context.fillText(score, scoreDisplay.x + 60, scoreDisplay.y);
        context.restore();
    }

    function onKeyDown(event) {
        if(playing == false) return;
        // Left Arrow
        if(event.keyCode == 37 && !player.goingLeft)
            player.goingLeft = true;
        // Right Arrow
        if(event.keyCode == 39 && !player.goingRight)
            player.goingRight = true;
    }

    function onKeyUp(event) {
        // Enter
        if(event.keyCode == 13) {
            if(!playing) {
                start();
                event.preventDefault();
                return;
            }
        }
        if(playing == false)
            return;
        // Left Arrow
        if(event.keyCode == 37)
            player.goingLeft = false;
        // Right Arrow
        if(event.keyCode == 39)
            player.goingRight = false;
    }

    function onCanvasTouchStartHandler(event) {
        if(playing == false) start();
    }

    function onWindowResizeHandler() {
        // Resize the game
        game.width(world.width);
        game.height(world.height);

        // Resize the canvas
        canvas.width = world.width;
        canvas.height = world.height;

        // Determine the x/y position of the canvas
        var cx = Math.max((window.innerWidth - world.width) * 0.5, 1);
        var cy = Math.max((window.innerHeight - world.height) * 0.5, 1);

        // Update the position of the canvas
        game.css({
            left: cx,
            top: cy
        });

        // Center the menu
        menu.css({
            top: (world.height - menu.height()) * 0.5,
            left: (world.width - menu.width()) * 0.5
        });

        // Buttons for mobile
        if(isMobile()) {
            $('#leftButton').css({
                display: 'inline-block',
                position: 'absolute',
                left: cx,
                top: window.innerHeight - cy + 24,
                height: (window.innerHeight - canvas.height) * 0.3,
                width: canvas.width * 0.5
            });
    
            $('#rightButton').css({
                display: 'inline-block',
                position: 'absolute',
                left: cx + canvas.width * 0.5,
                top: window.innerHeight - cy + 24,
                height: (window.innerHeight - canvas.height) * 0.3,
                width: canvas.width * 0.5
            });
        }
    }

    window.onload = load;
})();

/**
 * Shim layer with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(/* function */callback, /* DOMElement */element) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

/**
 * Verify if is an access from a mobile device.
 */
function isMobile() {
    var result = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))result = true})(navigator.userAgent||navigator.vendor||window.opera);
    return result;
}

/**
 * Returns a random rgb color.
 */
function getRandomColor() {
    var rint = Math.round(0xffffff * Math.random());
    return 'rgb(' + (rint >> 16) + ',' + (rint >> 8 & 255) + ',' + (rint & 255) + ')';
}

/**
 * Defines a 2D position.
 */
function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Point.prototype.distanceTo = function(p) {
    var dx = p.x - this.x;
    var dy = p.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
};

Point.prototype.distanceToSquared = function(p) {
    var dx = p.x - this.x;
    var dy = p.y - this.y;
    return (dx * dx) + (dy * dy);
};

/**
 * Base class for all game entities.
 */
function Entity(x, y) {
    this.alive = false;
}
Entity.prototype = new Point();

/**
 * Ball entity.
 */
function Ball(x, y, size, speed, color) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.color = color || 'rgba(255, 255, 255, 0.9)';
    this.goingLeft = false;
    this.goingRight = false;
}
Ball.prototype = new Entity();

Ball.prototype.intersects = function(b) {
    var t = (this.size + b.size) * (this.size + b.size);
    var distance = this.distanceToSquared(b);
    if(distance <= t)
        return true;
    return false;
};

/**
 * Particle entity.
 */
function Particle(x, y, speed, color, size) {
    this.x = x;
    this.y = y;
    this.velocity = {
        x : -speed + (Math.random() * speed * 2),
        y : -speed + (Math.random() * speed * 2)
    };
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.fading = false;
}
Particle.prototype = new Entity();

/**
 * Notification entity.
 */
function Notification(text, x, y, scale, rgb) {
    this.text = text || '';
    this.x = x || 0;
    this.y = y || 0;
    this.scale = scale || 1;
    this.rgb = rgb || [255, 255, 255];
    this.alpha = 1;
}
Notification.prototype = new Entity();

/**
 * Quadratic function.
 */
function QuadraticFunction(a, b, c)  {
    return function(x) {
        return a * (x * x) + b * x +c;
    }
}
