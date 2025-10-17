export default class DialogueManager {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.dialogueBox = null;
        this.avatar = null;
        this.textEnglish = null;
        this.textJapanese = null;
        this.choiceButtons = [];

        this.fontFamily = config.fontFamily || 'PixelFont';
        this.bilingual = config.bilingual ?? false;
        this.typingSpeed = config.typingSpeed || 30;

        this.avatarName = config.avatarName || 'Risu';
        this.avatarKey = config.avatarKey || rintsukiAvatar;
        this.dialogueBoxKey = config.dialogueBoxKey || dialogueBox;

        this.isAutoPlaying = false;
        this.currentAudio = null;
    }

    createUI() {
        const { width, height } = this.scene.cameras.main;

        // Dialogue box
        this.dialogueBox = this.scene.add.image(width / 2, height-200, this.dialogueBoxKey)
            .setOrigin(0.5, 0.5)
            .setDepth(100)
            .setScale(2, 2)
            .setScrollFactor(0);

        // Avatar (bottom-left)
        if (this.avatarKey) {
            this.avatar = this.scene.add.image(400, height, this.avatarKey)
                .setOrigin(0.5, 1)
                .setDepth(101)
                .setScrollFactor(0);

            // set avatar scale
            let xScale = 250/this.avatar.width;
            let yScale = 400/this.avatar.width;
            let scale = Math.min(xScale, yScale);
            this.avatar.setScale(scale);
        }

        // Name text 
        this.textName = this.scene.add.text(560, height - 320, this.avatarName, {
            fontFamily: this.fontFamily,
            fontSize: '36px',
            color: 'rgb(255, 238, 213)',
            wordWrap: { width: (width - 1000) / 2 - 10 }
        }).setDepth(102).setScrollFactor(0);

        // English text (left half)
        this.textEnglish = this.scene.add.text(530, height - 250, '', {
            fontFamily: this.fontFamily,
            fontSize: '36px',
            color: '#333333',
            wordWrap: { width: (width - 1000) / 2 - 10 }
        }).setDepth(102).setScrollFactor(0);

        if (this.bilingual) {
            // Japanese text (right half)
            this.textJapanese = this.scene.add.text(width / 2 + 30, height - 250, '', {
                fontFamily: this.fontFamily,
                fontSize: '36px',
                color: '#333333',
                wordWrap: { width: (width - 1000) / 2 - 10 }
            }).setDepth(102).setScrollFactor(0);
        }

        this.dialogueBox.setVisible(false);
        if (this.avatar) this.avatar.setVisible(false);
        this.textName.setVisible(false);
        this.textEnglish.setVisible(false);
        if (this.textJapanese) this.textJapanese.setVisible(false);
    }

    async startDialogue(dialogues = []) {
        if (!this.dialogueBox) this.createUI();

        this.dialogueBox.setVisible(true);
        if (this.avatar) this.avatar.setVisible(true);
        this.textName.setVisible(true);
        this.textEnglish.setVisible(true);
        if (this.textJapanese) this.textJapanese.setVisible(true);

        for (const line of dialogues) {
            await this.showLine(line);
        }

        this.hideDialogue();
    }

    async showLine(line) {
        return new Promise((resolve) => {
            const { english = '', japanese = '', voiceKey = null, choices = null } = line;

            this.textEnglish.setText('');
            if (this.textJapanese) this.textJapanese.setText('');

            // Play voice if exists
            if (voiceKey) {
                if (this.currentAudio) this.currentAudio.stop();
                this.currentAudio = this.scene.sound.add(voiceKey);
                this.currentAudio.play();
            }

            // Typing effect
            let i = 0;
            const fullEN = english;
            const fullJP = japanese;
            const timer = this.scene.time.addEvent({
                delay: this.typingSpeed,
                callback: () => {
                    this.textEnglish.setText(fullEN.slice(0, i + 1));
                    if (this.textJapanese) this.textJapanese.setText(fullJP.slice(0, i + 1));
                    i++;
                    if (i >= Math.max(fullEN.length, fullJP.length)) {
                        timer.remove(false);
                        this.addChoices(choices, resolve);
                    }
                },
                loop: true
            });

            // Advance with SPACE if no choices
            this.scene.input.keyboard.once('keydown-SPACE', () => {
                timer.remove(false);
                this.textEnglish.setText(fullEN);
                if (this.textJapanese) this.textJapanese.setText(fullJP);
                this.addChoices(choices, resolve);
            });
        });
    }

    addChoices(choices, resolve) {
        // Remove old buttons
        this.choiceButtons.forEach(btn => btn.destroy());
        this.choiceButtons = [];

        if (!choices) {
            // No choices: wait for space again to continue
            // TODO make space bar work for the listen option
            this.scene.input.keyboard.once('keydown-SPACE', () => resolve());
            return;
        }

        const baseY = this.scene.cameras.main.height - 130;
        choices.forEach((choice, idx) => {
            const btn = this.scene.add.text(550 + idx * 600, baseY, `[${choice.text}]`, {
                fontFamily: this.fontFamily,
                fontSize: '24px',
                color: '#ffcc88',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: { x: 10, y: 5 }
            })
                .setDepth(105)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    choice.callback?.();
                    this.choiceButtons.forEach(b => b.destroy());
                    resolve();
                });
            this.choiceButtons.push(btn);
        });
    }

    /** Subtitle-style auto-advancing dialogue synced with an audio track */
    playSubtitledAudio(audioKey, subtitles) {
        if (!this.dialogueBox) this.createUI();

        this.dialogueBox.setVisible(true);
        if (this.avatar) this.avatar.setVisible(true);
        this.textName.setVisible(true);
        this.textEnglish.setVisible(true);
        if (this.textJapanese) this.textJapanese.setVisible(true);

        if (this.currentAudio) this.currentAudio.stop();
        this.currentAudio = this.scene.sound.add(audioKey);
        this.currentAudio.play();

        let index = 0;
        const updateSubtitle = () => {
            const sub = subtitles[index];
            if (!sub) return;

            this.textEnglish.setText(sub.english);
            if (this.textJapanese) this.textJapanese.setText(sub.japanese);
        };

        updateSubtitle();

        const timer = this.scene.time.addEvent({
            delay: 200,
            callback: () => {
                const time = this.currentAudio.seek; // current playback time
                if (index < subtitles.length - 1 && time >= subtitles[index + 1].time) {
                    index++;
                    updateSubtitle();
                }
            },
            loop: true
        });

        this.currentAudio.once('complete', () => {
            timer.remove(false);
            this.hideDialogue();
        });
    }

    hideDialogue() {
        if (this.dialogueBox) this.dialogueBox.setVisible(false);
        if (this.avatar) this.avatar.setVisible(false);
        if (this.textName) this.textName.setVisible(false);
        if (this.textEnglish) this.textEnglish.setVisible(false);
        if (this.textJapanese) this.textJapanese.setVisible(false);
        this.choiceButtons.forEach(btn => btn.destroy());
        this.choiceButtons = [];
    }
}
