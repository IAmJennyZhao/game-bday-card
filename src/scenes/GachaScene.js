
import { quests } from '../managers/QuestManager.js';
import { fourStarGenshinVideo, fourStarWuwaVideo, fourStarHSRVideo, fiveStarGenshinVideo, fiveStarWuwaVideo, fiveStarHSRVideo,
    fourStarDrPepper, fourStarDumplings, fourStarJinhsi, fourStarKansaiBen, fourStarNekotaTsuna,
    fourStarOverwatch, fourStarReaverVandal, fourStarRushia, fourStarVrcgun, fourStarWuwa, 
    fiveStarCamellya, fiveStarJapaneseSoufflePancakes, fiveStarRisu, fiveStarValorant } from '../assets';

export default class GachaScene extends Phaser.Scene {
    constructor() { super('GachaScene'); }

    preload() {
        // Load all gacha videos
        this.load.video('fourStarGenshinVideo', fourStarGenshinVideo);
        this.load.video('fourStarWuwaVideo', fourStarWuwaVideo);
        this.load.video('fourStarHSRVideo', fourStarHSRVideo);
        this.load.video('fiveStarGenshinVideo', fiveStarGenshinVideo);
        this.load.video('fiveStarWuwaVideo', fiveStarWuwaVideo);
        this.load.video('fiveStarHSRVideo', fiveStarHSRVideo);

        // load all prize images
        this.load.image('fourStarDrPepper', fourStarDrPepper);
        this.load.image('fourStarDumplings', fourStarDumplings);
        this.load.image('fourStarJinhsi', fourStarJinhsi);
        this.load.image('fourStarKansaiBen', fourStarKansaiBen);
        this.load.image('fourStarNekotaTsuna', fourStarNekotaTsuna);
        this.load.image('fourStarOverwatch', fourStarOverwatch);
        this.load.image('fourStarReaverVandal', fourStarReaverVandal);
        this.load.image('fourStarRushia', fourStarRushia);
        this.load.image('fourStarVrcgun', fourStarVrcgun);
        this.load.image('fourStarWuwa', fourStarWuwa);
        this.load.image('fiveStarCamellya', fiveStarCamellya);
        this.load.image('fiveStarJapaneseSoufflePancakes', fiveStarJapaneseSoufflePancakes);
        this.load.image('fiveStarRisu', fiveStarRisu);
        this.load.image('fiveStarValorant', fiveStarValorant);
    }


    create() {
        // TODO: update UI when in viewing stage - maybe don't delete? 
        // Gacha UI
        this.add.text(300, 200, '🎰 Shrine Gacha', { font: '32px monospace', fill: '#fff' });
        this.gachaRules = this.add.text(320, 260, 'Goal Get a 5 star! (4 star chance: 90%, 5 star chase: 10%)', { font: '24px monospace', fill: '#fff' });
        this.resultText = this.add.text(320, 320, '', { font: '20px monospace', fill: '#fff' });
        this.pullCount = 0;
        this.spinBtn = this.add.text(340, 380, '[SPACE] Spin', { font: '20px monospace', fill: '#ff0' });
        this.spinBtn = this.add.text(340, 440, '[Q] Leave Gacha Shrine', { font: '20px monospace', fill: '#ff0' });
        this.skipBtn = this.add.text(600, 900, '', { font: '20px monospace', fill: '#ff0' });
        if (quests.gachaComplete) this.resultText.setText("You already got a 5 star, you don't need to pull more!");

        // Input listeners
        this.input.keyboard.on('keydown-Q', () => this.scene.start('MainScene'));
        this.input.keyboard.on('keydown-SPACE', () => this.spin());

        // Gacha videos and prize images
        this.gachaVideoIds = [
            {'name': 'fourStarGenshinVideo', 'playbackRate': 1.0},
            {'name': 'fourStarWuwaVideo', 'playbackRate': 0.9},
            {'name': 'fourStarHSRVideo', 'playbackRate': 2.3},
            {'name': 'fiveStarGenshinVideo', 'playbackRate': 1.0},
            {'name': 'fiveStarWuwaVideo', 'playbackRate': 1.5},
            {'name': 'fiveStarHSRVideo', 'playbackRate': 3.3}
        ];
        this.prizeImgs = ['fourStarDrPepper', 'fourStarDumplings', 'fourStarJinhsi', 'fourStarKansaiBen', 'fourStarNekotaTsuna',
            'fourStarOverwatch', 'fourStarReaverVandal', 'fourStarRushia', 'fourStarVrcgun', 'fourStarWuwa', 
            'fiveStarCamellya', 'fiveStarJapaneseSoufflePancakes', 'fiveStarRisu', 'fiveStarValorant'
        ];

        // Pull states
        this.PullStates = {
            None: 'None', 
            MidPull: 'MidPull', 
            ViewingPrize: 'ViewingPrize'
        };
        this.pullState = this.PullStates.None;

        // visible gacha video and prize image
        this.playingVideo = null;
        this.viewingPrize = null;
        this.viewingPrizeCall = null;
    }

    spin() {
        // If mid pull, skip to Prize Viewing
        if (this.pullState === this.PullStates.MidPull) {
            this.pullState = this.PullStates.ViewingPrize;
            this.playingVideo.stop();
            if (this.viewingPrizeCall) {
                this.viewingPrizeCall.delay = 1; // skip to prize viewing
            }
        } 
        // If viewing prize, close prize and return to None
        else if (this.pullState === this.PullStates.ViewingPrize) {
            this.playingVideo.destroy();
            this.viewingPrize.destroy();
            this.pullState = this.PullStates.None;
            this.skipBtn.setText('')
        } else {
            // randomly determine 4 or 5 star (90% 4-star, 10% 5-star)
            // hard pity at 6th pull
            this.pullCount++;
            let result;
            const r = Math.random();
            if (r < 0.9) result = 4;
            else result = 5;
            if (this.pullCount === 6) result = 5;

            this.playRandomGachaVideo(result);

            // Update result text and quest status
            let resultStr = `Your last pull was a ${result}★!`;
            if (quests.gachaComplete) resultStr += " You already got a 5 star, you don't need to pull more!";
            this.resultText.setText(resultStr);
            if (result === 5) {
                quests.gachaComplete = true;
            }

            // Update skip button text
            this.skipBtn.setText('[SPACE] Press Space to skip')
            this.skipBtn.setToTop();
        }
    }

    playRandomGachaVideo(star) {
        const i = Math.floor((Math.random()+(star-4))*this.gachaVideoIds.length/2);
        const vidId = this.gachaVideoIds[i]['name'];
        this.pullState = this.PullStates.MidPull;

        // Play randomized video
        const video = this.add.video(0, 0, vidId);
        video.setOrigin(0, 0);
        video.play();
        this.getPrize(star);
        video.setPlaybackRate(this.gachaVideoIds[i]['playbackRate']);
        this.playingVideo = video;
        
        // Resize background image to fit
        const cameraWidth = this.cameras.main.width;
        const cameraHeight = this.cameras.main.height;

        // Calculate scaling factors to cover the screen
        // TODO: figure out how to dynamically get video width/height
        const scaleX = cameraWidth / 1280;
        const scaleY = cameraHeight / 720;
        const scale = Math.max(scaleX, scaleY); // Use Math.max to ensure it covers the screen
        video.setScale(scale);

        // Center the video
        video.x = ((cameraWidth - 1280 * scaleX) / 2);
        video.y = ((cameraHeight - 720 * scaleY) / 2);

        // hide video & return to game when done
        video.once('complete', (videoGameObject) => {
            // videoGameObject.destroy();
            this.pullState = this.PullStates.ViewingPrize;
        })
    }

    getPrize(star) {
        // randomly select prize image based on star rating
        const startIdx = (star === 4) ? 0 : 10;
        const endIdx = (star === 4) ? 9 : 13;
        const i = Math.floor(Math.random() * (endIdx - startIdx + 1)) + startIdx;

        this.viewingPrizeCall = this.time.delayedCall(7000, () => {
            // Center the image on the screen
            let prizeImg = this.add.image(
                this.cameras.main.width / 2, 
                this.cameras.main.height / 2, 
                this.prizeImgs[i]
            );
            this.viewingPrize = prizeImg;

            // Resize background image to fit
            const cameraWidth = this.cameras.main.width;
            const cameraHeight = this.cameras.main.height;

            // Calculate scaling factors to cover the screen
            const scaleX = cameraWidth / prizeImg.width / 2;
            const scaleY = cameraHeight / prizeImg.height / 2;
            const scale = Math.min(scaleX, scaleY); // Use Math.max to ensure it covers the screen
            prizeImg.setScale(scale);
        }); // wait 7 seconds before showing prize
    }

    // todo: 4 or 5 star animation
    // todo: sound effects
    
}
