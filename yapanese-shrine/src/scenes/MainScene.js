import { quests, allComplete } from '../managers/QuestManager.js';
import { dialogues } from '../managers/DialogueManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bg', 'src/assets/background.png');
        this.load.spritesheet('player', 'src/assets/player.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.add.image(480, 270, 'bg').setOrigin(0.5);

        // Player setup
        this.player = this.physics.add.sprite(480, 400, 'player');
        this.player.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        // Interaction text
        this.interactText = this.add.text(20, 500, '', { font: '16px monospace', fill: '#fff' });

        // Define interact zones (x, y, id)
        this.zones = [
            { x: 480, y: 420, id: 'rintsuki' },
            { x: 360, y: 420, id: 'grassFriend' },
            { x: 480, y: 320, id: 'picnic' },
            { x: 720, y: 200, id: 'bridgeFriend' },
            { x: 480, y: 120, id: 'shrine' },
            { x: 200, y: 300, id: 'archery' },
            { x: 100, y: 200, id: 'portal' }
        ];

        this.zoneSprites = this.zones.map(z => this.add.zone(z.x, z.y, 40, 40).setOrigin(0.5));

        this.eKey = this.input.keyboard.addKey('E');
    }

    update() {
        // Movement
        const speed = 150;
        this.player.setVelocity(0);
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        if (this.cursors.down.isDown) this.player.setVelocityY(speed);

        // Check proximity to any zone
        let nearZone = null;
        for (let i = 0; i < this.zones.length; i++) {
            const z = this.zones[i];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x, z.y);
            if (dist < 40) nearZone = z;
        }

        if (nearZone) {
            this.interactText.setText(`[E] Interact with ${nearZone.id}`);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleInteraction(nearZone.id);
        } else {
            this.interactText.setText('');
        }
    }

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
        video.play();

        // hide video & return to game when done
        video.onended = () => {
            video.style.display = 'none';
            quests.talkedToPicnic = true;
        };
    }


    playDialogue(id) {
        const lines = dialogues[id];
        if (!lines) return;
        let i = 0;
        const textObj = this.add.text(50, 450, lines[i], { font: '18px monospace', fill: '#fff', backgroundColor: '#0008' });
        const advance = () => {
            i++;
            if (i >= lines.length) {
                textObj.destroy();
                this.markQuest(id);
                this.input.keyboard.off('keydown-SPACE', advance);
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
