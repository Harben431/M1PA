class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x87ceeb);

        this.add.text(400, 200, 'STAR CATCHER', {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const startBtn = this.add.text(400, 300, 'START GAME', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerdown', () => {
            this.scene.start('Level1Scene');
        });
    }
}

class BaseLevelScene extends Phaser.Scene {
    constructor(key, backgroundColor, platformData, bombSpawnRate = 4000) {
        super(key);
        this.sceneKey = key;
        this.backgroundColor = backgroundColor;
        this.platformData = platformData;
        this.bombSpawnRate = bombSpawnRate;
        this.colors = [0xff0000, 0xffa500, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0xee82ee];
        this.colorIndex = 0;
        this.coinsCollected = 0;
    }

    preload() {
        this.load.spritesheet('knight', 'assets/spritesheets/knight.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('coin', 'assets/spritesheets/coin.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.image('bomb', 'assets/images/bomb.png');
        this.load.audio('coinSound', 'assets/sounds/coin.wav');
        this.load.audio('explosion', 'assets/sounds/explosion.wav');
        this.load.audio('bgMusic', 'assets/sounds/time_for_adventure.mp3');
        this.load.audio('jump', 'assets/sounds/jump.wav');

    }

    create() {
        this.add.rectangle(400, 300, 800, 600, this.backgroundColor);

        this.platforms = this.physics.add.staticGroup();
        this.platformData.forEach(data => {
            const platform = this.add.rectangle(data.x, data.y, data.width, 20, 0x228B22);
            this.physics.add.existing(platform, true);
            platform.body.setSize(data.width, 20);
            this.platforms.add(platform);
        });

        this.player = this.physics.add.sprite(100, 450, 'knight').setScale(2).setCollideWorldBounds(true);
        this.player.body.setSize(20, 30).setOffset(6, 2);

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('knight', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('knight', { start: 4, end: 19 }),
            frameRate: 12,
            repeat: -1
        });

        this.player.play('idle');

        this.coin = this.physics.add.sprite(400, 0, 'coin').setScale(2);
        this.coin.setBounce(0);
        this.coin.setCollideWorldBounds(true);
        this.coin.body.setSize(16, 16).setOffset(0, 0);

        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 11 }),
            frameRate: 12,
            repeat: -1
        });

        this.coin.play('spin');

        this.bombs = this.physics.add.group();

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.coin, this.platforms);
        this.physics.add.overlap(this.player, this.coin, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.coinSound = this.sound.add('coinSound');
        this.explosionSound = this.sound.add('explosion');
        this.bgMusic = this.sound.add('bgMusic', {
            volume: 0.5,
            loop: true
        });
        this.bgMusic.play();

        this.jumpSound = this.sound.add('jump', { volume: 0.5 });

        this.coinText = this.add.text(400, 16, 'Coins Collected: 0', {
            fontFamily: 'Courier New',
            fontSize: '30px',
            color: '#ffffff'
        });

        this.time.addEvent({
            delay: this.bombSpawnRate,
            callback: this.spawnBomb,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true);
            this.player.play('run', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setFlipX(false);
            this.player.play('run', true);
        } else {
            this.player.setVelocityX(0);
            this.player.play('idle', true);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.jumpSound.play();
        }
    }

    collectCoin(player, coin) {
        this.coinSound.play();

        coin.disableBody(true, true);
        this.coinsCollected++;
        this.coinText.setText('Coins Collected: ' + this.coinsCollected);

        this.colorIndex = (this.colorIndex + 1) % this.colors.length;
        this.player.setTint(this.colors[this.colorIndex]);

        if (this.coinsCollected % 5 === 0) {
            this.player.setScale(this.player.scale + 0.1);
        }

        if (this.coinsCollected >= 10) {
            this.bgMusic.stop();
            this.scene.start(this.nextSceneKey);
        } else {
            this.spawnNewCoin();
        }
    }

    spawnNewCoin() {
        const x = Phaser.Math.Between(50, 750);
        const y = Phaser.Math.Between(0, 50);

        this.coin.enableBody(true, x, y, true, true);
        this.coin.setVelocity(0, 0);
        this.coin.setBounce(0);
        this.coin.setCollideWorldBounds(true);
        this.coin.play('spin');
    }

    spawnBomb() {
        const x = Phaser.Math.Between(50, 750);
        const bomb = this.bombs.create(x, 0, 'bomb');
        bomb.setVelocity(0, 250);
        bomb.body.setAllowGravity(true);

        bomb.setScale(0.1);
        bomb.body.checkCollision.up = false;
        bomb.body.checkCollision.down = false;
        bomb.body.checkCollision.left = false;
        bomb.body.checkCollision.right = false;
        bomb.body.setSize(bomb.width * 0.1, bomb.height * 0.1, true);

        this.time.delayedCall(8000, () => {
            if (bomb.active) bomb.destroy();
        });
    }

    hitBomb(player, bomb) {
        this.bgMusic.stop();
        this.explosionSound.play();
        bomb.destroy();
        this.player.setVisible(false);
        this.player.body.enable = false;
        this.scene.start('GameOverScene', { returnScene: this.sceneKey });
    }
}

class Level1Scene extends BaseLevelScene {
    constructor() {
        super('Level1Scene', 0xFF6B6B, [
            { x: 400, y: 590, width: 800 },
            { x: 700, y: 375, width: 120 },
            { x: 400, y: 450, width: 120 },
            { x: 175, y: 500, width: 100 },
            { x: 600, y: 500, width: 100 },
            { x: 50, y: 400, width: 100 }
        ], 1500);
        this.nextSceneKey = 'Level2Scene';
    }
}

class Level2Scene extends BaseLevelScene {
    constructor() {
        super('Level2Scene', 0xFCE38A, [
            { x: 400, y: 590, width: 800 },
            { x: 25, y: 500, width: 150 },
            { x: 500, y: 400, width: 150 },
            { x: 200, y: 450, width: 100 },
            { x: 700, y: 375, width: 100 },
            { x: 25, y: 350, width: 75 },
            { x: 300, y: 300, width: 150 },
            { x: 600, y: 500, width: 50 }
        ], 1000);
        this.nextSceneKey = 'Level3Scene';
    }
}

class Level3Scene extends BaseLevelScene {
    constructor() {
        super('Level3Scene', 0x1A1A40, [
            { x: 400, y: 590, width: 800 },
            { x: 250, y: 500, width: 150 },
            { x: 550, y: 400, width: 150 },
            { x: 50, y: 450, width: 125 },
            { x: 700, y: 350, width: 100 },
            { x: 400, y: 300, width: 150 },
            { x: 100, y: 350, width: 100 }
        ], 500);
        this.nextSceneKey = 'CongratulationsScene';
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.returnScene = data.returnScene || 'Level1Scene';
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000);
        this.add.text(400, 200, 'GAME OVER', {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#ff0000'
        }).setOrigin(0.5);

        const retryButton = this.add.text(400, 300, 'RETRY LEVEL', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        retryButton.on('pointerdown', () => {
            this.scene.start(this.returnScene);
        });

        const menuButton = this.add.text(400, 360, 'MAIN MENU', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

class CongratulationsScene extends Phaser.Scene {
    constructor() {
        super('CongratulationsScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000);

        this.add.text(400, 200, 'CONGRATULATIONS!', {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(400, 250, 'You completed all 3 levels!', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const retryButton = this.add.text(400, 310, 'RETRY', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        retryButton.on('pointerdown', () => {
            this.scene.start('Level1Scene');
        });

        const menuButton = this.add.text(400, 350, 'MAIN MENU', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: [
        MenuScene,
        Level1Scene,
        Level2Scene,
        Level3Scene,
        GameOverScene,
        CongratulationsScene
    ],
    title: 'Star Catcher'
};

const game = new Phaser.Game(config);
