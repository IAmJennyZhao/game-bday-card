import { quests, allComplete } from '../managers/QuestManager.js';
import { dialogues } from '../managers/DialogueManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bg', 'src/assets/background.png');
        this.load.spritesheet('player', 'src/assets/player.png', { frameWidth: 78, frameHeight: 210 });
    }


    create() {
        this.add.image(480, 270, 'bg').setOrigin(0.5);

        // Player setup
        this.player = this.physics.add.sprite(480, 400, 'player');
        this.player.setScale(0.2, 0.2);
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
            { x: 510, y: 390, id: 'rintsuki' },
            { x: 365, y: 430, id: 'grassFriend' },
            { x: 620, y: 320, id: 'picnic' },
            { x: 665, y: 160, id: 'bridgeFriend' },
            { x: 485, y: 210, id: 'shrine' },
            { x: 345, y: 252, id: 'archery' },
            { x: 280, y: 340, id: 'portal' }
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
        // Movement using arrow or wasd keys when interaction state is None
        this.player.setVelocity(0);
        if (this.interactionState === this.InteractionStates.None) {
            const speed = 150;
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
        // console.log(this.interactionState);
        console.log(nearZone!=null, this.interactionState === this.InteractionStates.None);
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

        if (id === 'shrine') this.scene.start('GachaScene');
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
        if (id === 'rintsuki') quests.talkedToRintsuki = true;
        if (id === 'grassFriend') quests.talkedToGrassFriend = true;
        if (id === 'picnic') quests.talkedToPicnic = true;
        if (id === 'bridgeFriend') quests.talkedToBridgeFriend = true;
    }
}
