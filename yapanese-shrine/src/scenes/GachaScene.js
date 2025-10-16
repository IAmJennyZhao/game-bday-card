import { quests } from '../managers/QuestManager.js';

export default class GachaScene extends Phaser.Scene {
    constructor() { super('GachaScene'); }

    create() {
        this.add.text(300, 200, '🎰 Shrine Gacha', { font: '24px monospace', fill: '#fff' });
        this.resultText = this.add.text(320, 260, '', { font: '20px monospace', fill: '#fff' });
        this.pullCount = 0;
        this.spinBtn = this.add.text(340, 320, '[SPACE] Spin', { font: '20px monospace', fill: '#ff0' });

        this.input.keyboard.on('keydown-SPACE', () => this.spin());

        this.gachaVideoIds = [
            {'name': '4StarGenshin', 'playbackRate': 1.0},
            {'name': '4StarWuwa', 'playbackRate': 0.9},
            {'name': '4StarHSR', 'playbackRate': 2.3},
            {'name': '5StarGenshin', 'playbackRate': 1.0},
            {'name': '5StarWuwa', 'playbackRate': 1.5},
            {'name': '5StarHSR', 'playbackRate': 3.3}
        ];
    }

    spin() {

        // randomly determine 4 or 5 star (90% 4-star, 10% 5-star)
        // hard pity at 6th pull
        this.pullCount++;
        let result;
        const r = Math.random();
        if (r < 0.9) result = 4;
        else result = 5;
        if (this.pullCount === 6) result = 5;

        this.playRandomGachaVideo(result);

        this.resultText.setText(`${result}★`);
        if (result === 5) {
            quests.gachaComplete = true;
            this.time.delayedCall(1500, () => this.scene.start('MainScene'));
        }
    }

    playRandomGachaVideo(star) {
        const i = Math.floor((Math.random()+(star-4))*this.gachaVideoIds.length/2);
        const vidId = this.gachaVideoIds[i]['name'];
        console.log(`Playing video: ${vidId} for ${star}-star`);

        // play video
        const video = document.getElementById(vidId);
        video.style.display = 'block';
        video.currentTime = 0;
        video.playbackRate = this.gachaVideoIds[i]['playbackRate'];
        // this.interactionState = this.InteractionStates.InCutscene;
        video.play();

        // hide video & return to game when done
        video.onended = () => {
            video.style.display = 'none';
            quests.talkedToPicnic = true;
            // this.interactionState = this.InteractionStates.None;
        };
    }

    // todo: resize image
    // todo: overlay image
    // todo: ui screen
    // todo: 4 or 5 star animation
    // todo: sound effects
    
}
