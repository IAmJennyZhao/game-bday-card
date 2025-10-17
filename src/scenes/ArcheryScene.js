import { quests } from '../managers/QuestManager.js';

export default class ArcheryScene extends Phaser.Scene {
    constructor() { super('ArcheryScene'); }

    preload() {
        this.load.image('valorantBG', './src/assets/images/valorant_range_bg.png');
        this.load.image('gun', './src/assets/images/prime_vandal.png');       // cropped gun png
        this.load.image('explosion', './src/assets/images/explosion_fx.png'); // small “bang” PNG
    }

    create() {
        // background
        const backgroundImage = this.add.image(0, 0, 'valorantBG').setDepth(0);

        // Resize background image to fit
        const cameraWidth = this.cameras.main.width;
        const cameraHeight = this.cameras.main.height;
        const scaleX = cameraWidth / backgroundImage.displayWidth;
        const scaleY = cameraHeight / backgroundImage.displayHeight;
        const scale = Math.max(scaleX, scaleY); // Use Math.max to ensure it covers the screen
        backgroundImage.setScale(scale);
        backgroundImage.x = ((cameraWidth) / 2);
        backgroundImage.y = ((cameraHeight) / 2);

        // gun overlay bottom-right
        this.gun = this.add.image(1800, 900, 'gun').setDepth(5).setScale(0.5);

        // title and timer text
        this.add.text(300, 30, '🏹 Archery Range (GET 100 Points!)', { font: '30px monospace', fill: '#fff' , backgroundColor: '#0008' }).setDepth(10);
        this.add.text(700, 160, 'GET 100 POINTS', { font: '60px monospace', fill: '#058d32ff' , backgroundColor: 'rgba(255, 255, 255, 1)' }).setDepth(10);
        this.timer = 20;
        this.timerText = this.add.text(1200, 30, 'Time: 20', { font: '30px monospace', fill: '#fff' , backgroundColor: '#0008' }).setDepth(10);
        
        // score text
        this.score = 0;
        this.scoreText = this.add.text(20, 400, 'Score: 0', {
        fontSize: '30px',
        fill: '#000000ff',
        fontFamily: 'monospace', 
        backgroundColor: 'rgba(255, 255, 255, 1)'
        }).setDepth(10);

        // countdown timer
        this.time.addEvent({ delay: 1000, callback: () => { Math.max(this.timer--, 0); this.timerText.setText(`Time: ${this.timer}`); }, loop: true });
        this.time.addEvent({ delay: 20000, callback: () => this.endGame() });

        // targets
        this.targets = [];
        this.spawnTarget();

        // click to shoot
        this.input.on('pointerdown', this.shoot, this);
    }

    spawnTarget() {
        this.targets.forEach((target) => target.destroy());
        this.targets = [];

        const x = Phaser.Math.Between(400, 1200);
        const y = Phaser.Math.Between(400, 700);

        this.targets.push(this.add.circle(x, y, 32, 0xffffff));
        this.targets.push(this.add.circle(x, y, 30, 0xff0000));
        this.targets.push(this.add.circle(x, y, 20, 0xffffff));
        this.targets.push(this.add.circle(x, y, 10, 0xff0000));

        // // make it bob slightly for motion
        // this.tweens.add({
        //     targets: target,
        //     y: y + 10,
        //     yoyo: true,
        //     repeat: -1,
        //     duration: 800,
        //     ease: 'sine.inout'
        // });
    }

    shoot(pointer) {
        if (this.targets.length==0) return;

        // small gun recoil animation
        this.tweens.add({
            targets: this.gun,
            angle: 10,
            duration: 50,
            yoyo: true
        });

        // check for hit
        let target = this.targets[0];
        const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, target.x, target.y);
        let pts = 0;
        if (d < 10) pts = 10;
        else if (d < 20) pts = 3;
        else if (d < 32) pts = 1;
        
        const hit = pts > 0 ? target : null;
        if (hit) {
            this.createExplosion(hit.x, hit.y);
            this.showPoints(hit.x, hit.y, `+${pts}!`, false);
            this.score += pts;
            this.scoreText.setText('Score: ' + this.score);
            this.spawnTarget();
        } else {
            console.log('miss');
            this.showPoints(pointer.x, pointer.y, 'Miss (lol)', true);
        }
    }

    createExplosion(x, y) {
        const exp = this.add.image(x, y, 'explosion').setDepth(2).setScale(0.1);
        this.tweens.add({
            targets: exp,
            alpha: 0,
            duration: 300,
            onComplete: () => exp.destroy()
        });
    }

    showPoints(x, y, text, miss=false) {
        const popup = this.add.text(x, y, text, {
            fontSize: '40px',
            fill: miss ? 'rgba(255, 46, 46, 1)' : '#0f0',
            fontFamily: 'monospace'
        }).setDepth(3).setOrigin(0.5);
        this.tweens.add({
            targets: popup,
            y: y - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => popup.destroy()
        });
    }

    endGame() {
        if (this.score >= 50) {
            quests.archeryComplete = true;
            this.add.text(350, 250, '✅ Passed!', { font: '100px monospace', fill: '#0f0' });
        } else {
            this.add.text(320, 250, '❌ Try Again!', { font: '100px monospace', fill: '#f00' });
        }
        this.time.delayedCall(2000, () => this.scene.start('MainScene'));
    }
    // choose which npcs to be targets in shooting range
}
/*  */