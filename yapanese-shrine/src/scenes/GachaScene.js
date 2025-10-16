import { quests } from '../managers/QuestManager.js';

export default class GachaScene extends Phaser.Scene {
    constructor() { super('GachaScene'); }

    preload() {
        // Load all gacha videos
        this.load.video('4StarGenshin', 'src/assets/video/gachas/4star_genshin.mp4');
        this.load.video('4StarWuwa', 'src/assets/video/gachas/4star_wuwa.mp4');
        this.load.video('4StarHSR', 'src/assets/video/gachas/4star_hsr.mp4');
        this.load.video('5StarGenshin', 'src/assets/video/gachas/5star_genshin.mp4');
        this.load.video('5StarWuwa', 'src/assets/video/gachas/5star_wuwa.mp4');
        this.load.video('5StarHSR', 'src/assets/video/gachas/5star_hsr.mp4');

        // load all prize images
        this.load.image('4_star_dr_pepper', 'src/assets/video/gachas/prize_imgs/4_star_dr_pepper.png');
        this.load.image('4_star_dumplings', 'src/assets/video/gachas/prize_imgs/4_star_dumplings.png');
        this.load.image('4_star_jinhsi', 'src/assets/video/gachas/prize_imgs/4_star_jinhsi.png');
        this.load.image('4_star_kansai_ben', 'src/assets/video/gachas/prize_imgs/4_star_kansai_ben.png');
        this.load.image('4_star_nekota_tsuna', 'src/assets/video/gachas/prize_imgs/4_star_nekota_tsuna.png');
        this.load.image('4_star_overwatch', 'src/assets/video/gachas/prize_imgs/4_star_overwatch.png');
        this.load.image('4_star_reaver_vandal', 'src/assets/video/gachas/prize_imgs/4_star_reaver_vandal.png');
        this.load.image('4_star_rushia', 'src/assets/video/gachas/prize_imgs/4_star_rushia.png');
        this.load.image('4_star_vrc', 'src/assets/video/gachas/prize_imgs/4_star_vrc.png');
        this.load.image('4_star_wuwa', 'src/assets/video/gachas/prize_imgs/4_star_wuwa.png');
        this.load.image('5_star_camellya', 'src/assets/video/gachas/prize_imgs/5_star_camellya.png');
        this.load.image('5_star_japanese_souffle_pancakees', 'src/assets/video/gachas/prize_imgs/5_star_japanese_souffle_pancakees.png');
        this.load.image('5_star_risu', 'src/assets/video/gachas/prize_imgs/5_star_risu.png');
        this.load.image('5_star_valorant', 'src/assets/video/gachas/prize_imgs/5_star_valorant.png');
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
            {'name': '4StarGenshin', 'playbackRate': 1.0},
            {'name': '4StarWuwa', 'playbackRate': 0.9},
            {'name': '4StarHSR', 'playbackRate': 2.3},
            {'name': '5StarGenshin', 'playbackRate': 1.0},
            {'name': '5StarWuwa', 'playbackRate': 1.5},
            {'name': '5StarHSR', 'playbackRate': 3.3}
        ];
        this.prizeImgs = ['4_star_dr_pepper', '4_star_dumplings', '4_star_jinhsi', '4_star_kansai_ben', '4_star_nekota_tsuna', 
            '4_star_overwatch', '4_star_reaver_vandal', '4_star_rushia', '4_star_vrc', '4_star_wuwa', 
            '5_star_camellya', '5_star_japanese_souffle_pancakees', '5_star_risu', '5_star_valorant'
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
