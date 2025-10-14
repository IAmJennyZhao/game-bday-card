import { quests } from '../managers/QuestManager.js';

export default class GachaScene extends Phaser.Scene {
    constructor() { super('GachaScene'); }

    create() {
        this.add.text(300, 200, '🎰 Shrine Gacha', { font: '24px monospace', fill: '#fff' });
        this.resultText = this.add.text(320, 260, '', { font: '20px monospace', fill: '#fff' });
        this.pullCount = 0;
        this.spinBtn = this.add.text(340, 320, '[SPACE] Spin', { font: '20px monospace', fill: '#ff0' });

        this.input.keyboard.on('keydown-SPACE', () => this.spin());
    }

    spin() {
        this.pullCount++;
        let result;
        const r = Math.random();
        if (r < 0.75) result = 3;
        else if (r < 0.95) result = 4;
        else result = 5;
        if (this.pullCount === 5) result = 5;

        this.resultText.setText(`${result}★`);
        if (result === 5) {
            quests.gachaComplete = true;
            this.time.delayedCall(1500, () => this.scene.start('MainScene'));
        }
    }
}
