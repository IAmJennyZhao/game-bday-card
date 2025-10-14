import { quests } from '../managers/QuestManager.js';

export default class ArcheryScene extends Phaser.Scene {
    constructor() { super('ArcheryScene'); }

    create() {
        this.add.text(300, 30, '🏹 Archery Range', { font: '24px monospace', fill: '#fff' });
        this.score = 0;
        this.timer = 20;
        this.scoreText = this.add.text(50, 50, 'Score: 0', { font: '18px monospace', fill: '#fff' });
        this.timerText = this.add.text(800, 50, 'Time: 20', { font: '18px monospace', fill: '#fff' });

        this.time.addEvent({ delay: 1000, callback: () => { this.timer--; this.timerText.setText(`Time: ${this.timer}`); }, loop: true });
        this.time.addEvent({ delay: 20000, callback: () => this.endGame() });

        this.spawnTarget();
        this.input.on('pointerdown', pointer => this.shoot(pointer));
    }

    spawnTarget() {
        if (this.target) this.target.destroy();
        const x = Phaser.Math.Between(100, 860);
        const y = Phaser.Math.Between(120, 480);
        this.target = this.add.circle(x, y, 40, 0xffffff);
        this.add.circle(x, y, 20, 0xff0000);
    }

    shoot(pointer) {
        if (!this.target) return;
        const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.target.x, this.target.y);
        let pts = 0;
        if (d < 10) pts = 10;
        else if (d < 20) pts = 3;
        else if (d < 40) pts = 1;
        this.score += pts;
        this.scoreText.setText(`Score: ${this.score}`);
        this.spawnTarget();
    }

    endGame() {
        if (this.score >= 50) {
            quests.archeryComplete = true;
            this.add.text(350, 250, '✅ Passed!', { font: '24px monospace', fill: '#0f0' });
        } else {
            this.add.text(320, 250, '❌ Try Again!', { font: '24px monospace', fill: '#f00' });
        }
        this.time.delayedCall(2000, () => this.scene.start('MainScene'));
    }
}
/*  */