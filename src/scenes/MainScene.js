import { quests, allComplete, getMissingMessage } from '../managers/QuestManager.js';
import DialogueManager, {dialogueData} from '../managers/DialogueManager.js';
import { bg, player, dialogueBox,
    bumblebeeVoice, rintsukiVoice, macsVoice, levenskiVoice, luoVoice, risuVoice, howlVoice, aniphaVoice, jorziVoice, thighsVoice, santruVoice, scarfyVoice, melVoice,
    bumblebeeAvatar, chrisAvatar, rintsukiAvatar, macsAvatar, levenskiAvatar, luoAvatar, risuAvatar, howlAvatar, aniphaAvatar, jorziAvatar, thighsAvatar, santruAvatar, scarfyAvatar, melAvatar
 } from '../assets';  

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // load background image and sprite
        this.load.image('bg', bg);
        this.load.spritesheet('player', player, { frameWidth: 78, frameHeight: 210 });
        
        this.load.image('dialogueBox', dialogueBox);

        // load all voice messages
        this.load.audio('bumblebeeVoice', bumblebeeVoice);
        this.load.audio('rintsukiVoice', rintsukiVoice);
        this.load.audio('macsVoice', macsVoice);
        this.load.audio('levenskiVoice', levenskiVoice);
        this.load.audio('luoVoice', luoVoice);
        this.load.audio('risuVoice', risuVoice);
        this.load.audio('howlVoice', howlVoice); // TODO howl's vid
        this.load.audio('aniphaVoice', aniphaVoice);
        this.load.audio('jorziVoice', jorziVoice);
        this.load.audio('thighsVoice', thighsVoice);
        this.load.audio('santruVoice', santruVoice);
        this.load.audio('scarfyVoice', scarfyVoice);
        this.load.audio('melVoice', melVoice);

        // load all npc avatars
        this.load.image('bumblebeeAvatar', bumblebeeAvatar);
        this.load.image('chrisAvatar', chrisAvatar);
        this.load.image('rintsukiAvatar', rintsukiAvatar);
        this.load.image('macsAvatar', macsAvatar);
        this.load.image('levenskiAvatar', levenskiAvatar);
        this.load.image('luoAvatar', luoAvatar);
        this.load.image('risuAvatar', risuAvatar);
        this.load.image('howlAvatar', howlAvatar);
        this.load.image('aniphaAvatar', aniphaAvatar);
        this.load.image('jorziAvatar', jorziAvatar);
        this.load.image('thighsAvatar', thighsAvatar);
        this.load.image('santruAvatar', santruAvatar);
        this.load.image('scarfyAvatar', scarfyAvatar);
        this.load.image('melAvatar', melAvatar);
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
        backgroundImage.x = ((cameraWidth - backgroundImage.displayWidth) / 2);
        backgroundImage.y = ((cameraHeight - backgroundImage.displayHeight) / 2);

        // Player setup
        this.player = this.physics.add.sprite(950, 900, 'player').setDepth(7);
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
        this.interactText = this.add.text(800, 900, '', { font: '32px monospace', fill: '#fff', backgroundColor: 'rgba(184, 151, 98, 0.52'}).setDepth(10);

        // Define interact zones (x, y, id)
        this.zones = [
            { x: 300, y: 880, id: 'Bumblebee' },
            { x: 1070, y: 820, id: 'Chris' },
            { x: 1790, y: 870, id: 'Rintsuki' },
            { x: 1380, y: 700, id: 'Macs' },
            { x: 1500, y: 700, id: 'Levenski' },
            { x: 1100, y: 700, id: 'Luo' },
            { x: 900, y: 700, id: 'Risu' },
            { x: 1360, y: 540, id: 'Howl' },
            { x: 1430, y: 540, id: 'Anipha' },
            { x: 330, y: 240, id: 'Jorzi' },
            { x: 1630, y: 240, id: 'Thighs' },
            { x: 1780, y: 240, id: 'Santru' },
            { x: 993, y: 440, id: 'Scarfy' },
            { x: 570, y: 450, id: 'Mel' },

            { x: 170, y: 620, id: 'portal' },
            { x: 330, y: 380, id: 'archery' },
            { x: 840, y: 390, id: 'gacha_shrine' }
        ];

        // add in npc images
        let maxHeight = 200;
        let maxWidth = 150;

        // loop through zones and add npc images
        this.zones.forEach(z => {
            if (z.id === 'archery' || z.id === 'gacha_shrine' || z.id === 'portal') {
                return;
            }
            // scale npc images to fit in box
            let npcImage = this.add.image(z.x, z.y, dialogueData[z.id].avatarKey).setDepth(5);
            let scaleX = maxWidth / npcImage.displayWidth;
            let scaleY = maxHeight / npcImage.displayHeight;
            let scale = Math.min(scaleX, scaleY);
            npcImage.setScale(scale);
        });

        this.zoneSprites = this.zones.map(z => this.add.zone(z.x, z.y, 40, 40).setOrigin(0.5));

        this.eKey = this.input.keyboard.addKey('E');

        // Interaction states
        this.InteractionStates = {
            None: 'None', 
            InDialogue: 'InDialogue', // listening to video or audio message
            InCutscene: 'InCutscene' // TYPE: change to this to a different type of dialogue 
        };
        this.interactionState = this.InteractionStates.None;
    }

    update() {
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
            if (z.id==='archery' || z.id==='gacha_shrine') {
                if (dist < 100) nearZone = z;
            } 
            if (dist < 40) nearZone = z;
        }
        if (nearZone!=null && (this.interactionState === this.InteractionStates.None)) {
            this.interactText.setText(`[E] Interact with ${nearZone.id}`);
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleInteraction(nearZone.id);
        } else if (this.interactionState === this.InteractionStates.InDialogue) {
            // this.interactText.setText(`[Space] Continue Dialogue`); // TODO: set up guide tutorial dialogue maybe if i have time :3
            this.interactText.setText('');
        } else {
            this.interactText.setText('');
        }
    }

    handleInteraction(id) {
        if (id === 'portal') {
            if (allComplete()) {
                this.scene.start('EndingScene');
            } else {
                let messageDict = getMissingMessage();
                // TODO: Update with Risu's avatars
                let risuDialogue = new DialogueManager(this, {
                    avatarName: "Risu",
                    avatarKey: 'risuAvatar',
                    dialogueBoxKey: 'dialogueBox',
                    fontFamily: 'PixelFont',
                    bilingual: true
                });
                risuDialogue.startDialogue([
                    {
                        english: messageDict[0],
                        japanese: messageDict[1],
                    }
                ]);
            }
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
        if (!(id in dialogueData)) {
            console.warn(`No dialogue data found for id: ${id}`);
            return;
        }

        // Initalize dialogue managers with npc data
        this.interactionState = this.InteractionStates.InDialogue;
        let npcVoiceDialogue = new DialogueManager(this, {
            avatarName: dialogueData[id].avatarName,
            avatarKey: dialogueData[id].avatarKey,
            dialogueBoxKey: 'dialogueBox',
            fontFamily: 'PixelFont',
            bilingual: true
        });

        let npcVoiceMessageDialogue = new DialogueManager(this, {
            avatarName: dialogueData[id].avatarName,
            avatarKey: dialogueData[id].avatarKey,
            dialogueBoxKey: 'dialogueBox',
            fontFamily: 'PixelFont',
            bilingual: true
        });

        // Start initial dialogue
        npcVoiceDialogue.startDialogue([
            {
                english: dialogueData[id].initialDialogue.english,
                japanese: dialogueData[id].initialDialogue.japanese,
                voiceKey: dialogueData[id].initialDialogue.voiceKey,
                choices: [
                { 
                    text: "Listen to Voice Message (Space)", 
                    callback: () => {
                        if (!dialogueData[id].avatarVoiceMessage) {
                            npcVoiceMessageDialogue.startDialogue(dialogueData[id].subtitles, () => {
                                this.interactionState = this.InteractionStates.None;
                            });
                            return;
                        }
                        this.time.delayedCall(1000, npcVoiceMessageDialogue.playSubtitledAudio(dialogueData[id].avatarVoiceMessage, dialogueData[id].subtitles, () => {
                            this.interactionState = this.InteractionStates.None;
                        }));
                        this.markQuest(id);
                    }
                },
                { 
                    text: "Leave (Q)", 
                    callback: () => {
                        this.interactionState = this.InteractionStates.None;
                    }
                }
                ]
            }
        ]);
    }

    markQuest(id) {
        quests.talkedToNPCs[id] = true;
    }
}
