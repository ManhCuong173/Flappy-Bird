const canvas = document.getElementById('mycanvas');
const ctx = canvas.getContext('2d');

// AUDIO
const flap = new Audio();
const collision = new Audio();
const swoosthing = new Audio();
const die = new Audio();
const point = new Audio();

// AUDIO SRC
flap.src = './Flappy-asset/audio/sfx_flap.wav'
collision.src = './Flappy-asset/audio/sfx_hit.wav'
swoosthing.src = './Flappy-asset/audio/sfx_swooshing.wav'
die.src = './Flappy-asset/audio/sfx_die.wav';
point.src = './Flappy-asset/audio/sfx_point.wav'

// GAME VARS AND CONSTS
let frames = 0;
let playAgain = false;

// CONVERT DEGREE TO RADIAN 
let DEGREE = Math.PI / 180;

// LOAD SPRITE IMAGE
const sprite = new Image();
sprite.src = './Flappy-asset/sprite.png';

// FOREGROUND
const fg = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    dx: 2,
    y: canvas.height - 112,
    draw: function() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h)
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h)
    },

    update: function() {
        if (state.current == state.game) {
            this.x -= this.dx;
            this.x = this.x % (canvas.width - 448);
        }
    }
}

// GAME STATE
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2,
}

// CONTROL THE GAME STATE

function controlGameState(e) {
    flap.pause();
    collision.pause();

    switch (state.current) {
        case state.getReady:
            swoosthing.play();
            state.current = state.game;
            break;
        case state.game:
            playAgain = false;
            flap.play();
            bird.flap();
            break;
        case state.over:
            // RESET BIRD 
            bird.stopFlap();

            setTimeout(() => {
                playAgain = true;
            }, 500);

            if (playAgain == true) {
                state.current = state.getReady;

                // RESET VALUE
                let elem = canvas.getBoundingClientRect();
                let clientX = e.clientX - elem.left;
                let clientY = e.clientY - elem.top;
                if (clientX >= startBtn.left && clientX <= startBtn.left + startBtn.width && clientY >= startBtn.top && clientY <= startBtn.top + startBtn.height) {
                    // RESET PIPES
                    pipes.pipesReset();

                    // RESET BIRD 
                    bird.birdReset();

                    // SCORE RESET
                    score.scoreReset();
                }
            }
            break;
    }
}

canvas.addEventListener('click', controlGameState)

// BACKGROUND
const bg = {
    sX: 0,
    sY: 0,
    w: 275,
    h: 226,
    x: 0,
    y: canvas.height - 226,

    draw: function() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h)
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h)
    }
}

// BIRD 
const bird = {
    animation: [
        { sX: 276, sY: 112 },
        { sX: 276, sY: 140 },
        { sX: 276, sY: 165 },
        { sX: 276, sY: 113 }
    ],
    w: 36,
    h: 25,
    x: 50,
    y: 150,
    frame: 0,
    speed: 0,
    gravity: 0.1,
    jump: 2.5,
    fly: true,
    radiusX: 18,
    radiusY: 12.5,
    rotation: 0,
    draw: function() {
        let bird = this.animation[this.frame];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h, -this.w / 2, -this.h / 2, this.w, this.h)
        ctx.restore();
    },

    update: function() {
        // var global FRAMES r
        // epresent each frame of interval between requestAnimationFrame

        // If bird get ready to play, flap slowly (10)
        this.period = state.current == state.getReady ? 10 : 5;

        //  5 frames increament, the value of frame increase by 1
        this.fly ? this.frame += frames % this.period == 0 ? 1 : 0 : this.frame = 1;

        // Alway between from 0 values to the last element of animation array
        this.frame = this.frame % this.animation.length;

        // YOrdinate when the bird is ready to play
        if (state.current == state.getReady) {
            this.y = 150;
            this.fly = true;
            this.rotation = 0 * DEGREE;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            // IF THE SPEED IS GREATER THAN THE JUMP IS THAT THE BIRD IS FALLING DOWN
            if (this.speed >= this.jump) {
                // DIE EFFECT SOUND
                if(state.current == state.game) die.play();
                if (this.y + this.h / 2 >= fg.y) {
                    die.pause();
                    this.y = fg.y - this.h / 2;

                    if (state.current == state.game) {
                        state.current = state.over;
                        localStorage.setItem('best', score.bestScore);
                        this.rotation = 0 * DEGREE;
                        this.fly = false;
                    }
                } else {
                    this.rotation = 90 * DEGREE;
                }
            } else {
                this.rotation = -25 * DEGREE;
            }
        }
    },

    flap: function() {
        this.speed -= this.jump;
    },

    stopFlap: function() {
        this.speed += this.gravity;
    },

    birdReset: function() {
        this.speed = 0;
    }
}

// PIPES
const pipes = {
    position: [],

    top: {
        sX: 553,
        sY: 0,
    },

    bottom: {
        sX: 502,
        sY: 0,
    },

    w: 53,
    h: 400,
    gap: 85,
    maxYPos: -150,
    dx: 2,
    draw: function() {
        if (!this.position.length) return;
        if (this.position[0].x + this.w <= 0) {
            this.position.shift();
            // GET THE POINT SOUND
            point.play();
            score.currentScore += 1;
            score.bestScore = Math.max(score.currentScore, score.bestScore);
        }

        for (let index = 0; index < this.position.length; index++) {
            const pipe = this.position[index];
            if (state.current == state.game) pipe.x -= this.dx;
            if (bird.x + bird.radiusX >= pipe.x && bird.y + bird.radiusY > pipe.y && (bird.y + bird.radiusY < pipe.y + this.h || bird.y - bird.radiusY < pipe.y + this.h)) {
                state.current = state.over;
                collision.play()
                localStorage.setItem('best', score.bestScore);
            } else if (bird.x + bird.radiusX >= pipe.x && bird.y + bird.radiusY >= pipe.y + this.h + this.gap && bird.y + bird.radiusY < pipe.y + this.h + this.gap + (canvas.height - fg.h - (pipe.y + this.h + this.gap))) {
                state.current = state.over;
                collision.play();
                localStorage.setItem('best', score.bestScore);
            }
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, pipe.x, pipe.y, this.w, this.h);
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, pipe.x, pipe.y + this.h + this.gap, this.w, this.h);
        }
    },

    update: function() {
        if (frames % 100 == 0 && state.current == state.game) {
            this.position.push({
                x: canvas.width,
                y: this.maxYPos * (Math.random() + 1),
            })
        }
    },

    pipesReset: function() {
        this.position = [];
    }
}

// SCORE
const score = {
    bestScore: localStorage.getItem('best') || 0,
    currentScore: 0,
    draw: function() {
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';

        if (state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = '35px Teko';
            ctx.fillText(this.currentScore, canvas.width / 2 - ctx.measureText(this.currentScore).width / 2, 50);
            ctx.strokeText(this.currentScore, canvas.width / 2 - ctx.measureText(this.currentScore).width / 2, 50);
        } else if (state.current == state.over) {
            // FINAL SCORE
            ctx.font = '30px';
            ctx.fillText(this.currentScore, 225 - ctx.measureText(this.currentScore).width / 2, 240);
            ctx.strokeText(this.currentScore, 225 - ctx.measureText(this.currentScore).width / 2, 240);
            // BEST SCORE
            ctx.fillText(this.bestScore, 225 - ctx.measureText(this.bestScore).width / 2, 282)
            ctx.strokeText(this.bestScore, 225 - ctx.measureText(this.bestScore).width / 2, 282)
        }
    },

    scoreReset: function() {
        this.currentScore = 0;
    }
}

// MEDAL
const medals = {
    medals: [
        {name: 'lowest', sX: 313, sY: 113, w: 45, h: 45},
        {name: 'medium', sX: 360, sY: 113, w: 45, h: 45},
        {name: 'excellent', sX: 360, sY: 158, w: 45, h: 45},
        {name: 'good', sX: 313, sY: 158, w: 45, h: 45},
    ],
    x: 75,
    y:228,

    draw: function() {
        if(state.current == state.over) {
            let currentMedal = 0;
            if(score.currentScore <= 20) {
                currentMedal = 0;
            } else if(score.currentScore > 20 && score.currentScore <=  50) currentMedal = 1
            else if(score.currentScore >50 && score.currentScore <= 100) currentMedal = 2
            else currentMedal =3

            ctx.drawImage(sprite, this.medals[currentMedal].sX, this.medals[currentMedal].sY, this.medals[currentMedal].w, this.medals[currentMedal].h, this.x, this.y, this.medals[currentMedal].w, this.medals[currentMedal].h)
        }
    }
}

//  START BUTTON COORDINATES
const startBtn = {
    top: 312,
    left: 120,
    width: 80,
    height: 25,
}

// GET READY MESSAGE
const getReady = {
    sX: 0,
    sY: 227,
    w: 174,
    h: 160,
    x: canvas.width / 2 - 173 / 2,
    y: canvas.height / 2 - 160 / 2,
    draw: function() {
        if (state.current == state.getReady) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h)
        }
    },
}

// GAME OVER MESSAGE
const gameOver = {
    sX: 175,
    sY: 228,
    w: 225,
    h: 202,
    x: canvas.width / 2 - 225 / 2,
    y: canvas.height / 2 - 202 / 2,

    draw: function() {
        if (state.current == state.over) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h)
        }
    },
}

// DRAW
function draw() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DRAW BACKGROUND
    bg.draw();

    // PIPES
    pipes.draw();

    // DRAW FOREGROUND
    fg.draw();

    // BIRD
    bird.draw();

    // GET READY
    getReady.draw();

    // GAME OVER
    gameOver.draw();

     //MEDAL
     medals.draw();

    // SCORE
    score.draw();
}

//UPDATE 
function update() {
    //PIPES
    pipes.update();

    //FOREGROUND
    fg.update();

    // BIRD
    bird.update();
}

// LOOP
function loop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}

loop();