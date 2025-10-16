import { quests, allComplete } from '../managers/QuestManager.js';
import { dialogues } from '../managers/DialogueManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // load background image and sprite
        this.load.image('bg', 'src/assets/background.png');
        this.load.spritesheet('player', 'src/assets/player.png', { frameWidth: 78, frameHeight: 210 });
    }


    create() {
        // Resize background image to fit
        const cameraWidth = this.cameras.main.width;
        const cameraHeight = this.cameras.main.height;
        const backgroundImage = this.add.image(0, 0, 'bg').setOrigin(0, 0);

        // Calculate scaling factors to cover the screen
        const scaleX = cameraWidth / backgroundImage.width;
        const scaleY = cameraHeight / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY); // Use Math.max to ensure it covers the screen

        // Apply the scale
        backgroundImage.setScale(scale);

        // Center the image if necessary (to account for potential overflow on one axis)
        backgroundImage.x = 0 - ((backgroundImage.displayWidth - cameraWidth) / 2);
        backgroundImage.y = 0 - ((backgroundImage.displayHeight - cameraHeight) / 2);

        // // Optional: Make the background fixed relative to the camera
        // backgroundImage.setScrollFactor(0);




        // Player setup
        this.player = this.physics.add.sprite(950, 900, 'player');
        this.player.setScale(0.5, 0.5);
        this.player.setCollideWorldBounds(true);

        // Add arrow and wasd movement listeners
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        // Interaction text
        this.interactText = this.add.text(20, 500, '', { font: '16px monospace', fill: '#fff' });

        // Define interact zones (x, y, id)
        this.zones = [
            { x: 1070, y: 820, id: 'torii_gate_friend' },
            { x: 300, y: 880, id: 'grass_friend_1' },
            { x: 1790, y: 870, id: 'grass_friend_2' },
            { x: 1380, y: 700, id: 'picnic_friend_1' },
            { x: 1500, y: 700, id: 'picnic_friend_2' },
            { x: 1360, y: 540, id: 'picnic_friend_3' },
            { x: 1430, y: 540, id: 'picnic_friend_4' },
            { x: 1630, y: 240, id: 'bridge_friend_1' },
            { x: 1780, y: 240, id: 'bridge_friend_2' },
            { x: 993, y: 440, id: 'shrine_friend' },
            { x: 570, y: 450, id: 'archery_friend_1' },
            { x: 510, y: 470, id: 'archery_friend_2' },
            { x: 1290, y: 210, id: 'river_friend_1' },
            { x: 1380, y: 250, id: 'river_friend_2' },
            { x: 500, y: 720, id: 'portal_friend' },
            { x: 170, y: 620, id: 'portal' },
            { x: 380, y: 460, id: 'archery' },
            // { x: 1500, y: 610, id: 'picnic' },
            { x: 870, y: 390, id: 'gacha_shrine' }
        ];

        this.zoneSprites = this.zones.map(z => this.add.zone(z.x, z.y, 40, 40).setOrigin(0.5));

        this.eKey = this.input.keyboard.addKey('E');

        // Interaction states
        this.InteractionStates = {
            None: 'None', 
            InDialogue: 'InDialogue', 
            InCutscene: 'InCutscene'
        };
        this.interactionState = this.InteractionStates.None;
    }

    update() {
        console.log(this.player.x, this.player.y);

        // Movement using arrow or wasd keys when interaction state is None
        this.player.setVelocity(0);
        if (this.interactionState === this.InteractionStates.None) {
            const speed = 400;
            let xVel = 0;
            let yVel = 0;

            if (this.cursors.left.isDown || this.wasdKeys.left.isDown) xVel += -speed;
            if (this.cursors.right.isDown || this.wasdKeys.right.isDown) xVel += speed;
            if (this.cursors.up.isDown || this.wasdKeys.up.isDown) yVel += -speed;
            if (this.cursors.down.isDown || this.wasdKeys.down.isDown) yVel += speed;

            this.player.setVelocityX(xVel);
            this.player.setVelocityY(yVel);
        }

        // Check proximity to any zone
        let nearZone = null;
        for (let i = 0; i < this.zones.length; i++) {
            const z = this.zones[i];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x, z.y);
            if (dist < 40) nearZone = z;
        }
        if (nearZone!=null && (this.interactionState === this.InteractionStates.None)) {
            this.interactText.setText(`[E] Interact with ${nearZone.id}`);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleInteraction(nearZone.id);
        } else if (this.interactionState === this.InteractionStates.InDialogue) {
            this.interactText.setText(`[Space] Continue Dialogue`);
        } else {
            this.interactText.setText('');
        }
    }
w
    handleInteraction(id) {
        if (id === 'portal' && allComplete()) {
            this.scene.start('EndingScene');
            return;
        }

        if (id === 'gacha_shrine') this.scene.start('GachaScene');
        else if (id === 'archery') this.scene.start('ArcheryScene');
        else if (id === 'picnic') this.playVideoCutscene();
        else this.playDialogue(id);
    }

    playVideoCutscene() {
        const video = document.getElementById('birthdayVideo');
        video.style.display = 'block';
        video.currentTime = 0;
        this.interactionState = this.InteractionStates.InCutscene;
        video.play();

        // hide video & return to game when done
        video.onended = () => {
            video.style.display = 'none';
            quests.talkedToPicnic = true;
            this.interactionState = this.InteractionStates.None;
        };
    }


    playDialogue(id) {
        // find lines and play dialogue
        const lines = dialogues[id];
        if (!lines) return;
        let i = 0;
        this.interactionState = this.InteractionStates.InDialogue;
        const textObj = this.add.text(50, 450, lines[i], { font: '18px monospace', fill: '#fff', backgroundColor: '#0008' });
        const advance = () => {
            i++;
            if (i >= lines.length) {
                // finish dialogue and mark quest complete
                textObj.destroy();
                this.markQuest(id);
                this.input.keyboard.off('keydown-SPACE', advance);
                
                this.interactionState = this.InteractionStates.None;
            } else textObj.setText(lines[i]);
        };
        this.input.keyboard.on('keydown-SPACE', advance);
    }

    markQuest(id) {
        // TODO: update quest progression
        if (id === 'rintsuki') quests.talkedToRintsuki = true;
        if (id === 'grassFriend') quests.talkedToGrassFriend = true;
        if (id === 'picnic') quests.talkedToPicnic = true;
        if (id === 'bridgeFriend') quests.talkedToBridgeFriend = true;
    }
}
