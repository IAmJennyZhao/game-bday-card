export default class DialogueManager {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.dialogueBox = null;
        this.avatar = null;
        this.textEnglish = null;
        this.textJapanese = null;
        this.choiceButtons = [];
        this.keyListener = null;

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
        });
    }

    addChoices(choices, resolve) {
        // Remove old buttons
        if (this.keyListener) this.keyListener.off('keydown');
        this.keyListener = null;
        this.choiceButtons.forEach(btn => btn.destroy());
        this.choiceButtons = [];

        if (!choices) {
            // No choices: wait for space again to continue
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
                    if (this.keyListener) this.keyListener.off('keydown');
                    this.keyListener = null;
                    this.choiceButtons.forEach(b => b.destroy());
                    this.choiceButtons = [];
                    resolve();
                });
            this.choiceButtons.push(btn);
        });

        this.keyListener = this.scene.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Space') {
                this.choiceButtons[0].emit('pointerdown');
            }
            else if (event.key.toLowerCase() === 'q') {
                this.choiceButtons[1].emit('pointerdown');
            }
        });
    }

    /** Subtitle-style auto-advancing dialogue synced with an audio track */
    playSubtitledAudio(audioKey, subtitles, completeCallback = null) {
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
            if (completeCallback) completeCallback();
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


export const dialogueData = {
    'Bumblebee': {
        avatarName: "Bumblebee",
        avatarKey: 'bumblebeeAvatar',
        avatarVoiceMessage: 'bumblebeeVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "Happy Birthday, Void!", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 2.7, english: "Congrats on hitting 19 years old. so awesome.", japanese: "お誕生日おめでとう。" },
            { time: 6.2, english: "When you finish celebrating, we should play more freaking overwatch and hit diamond.", japanese: "これからも、仲良くしようね。" },
            { time: 12, english: "Happy Birthday femboyyyyy", japanese: "また皆で、ゲームとか通話 とか何でもいいけど、 それで遊ぼうね"}
        ]
    },
    
    'Rintsuki': {
        avatarName: "Rintsuki",
        avatarKey: 'rintsukiAvatar',
        avatarVoiceMessage: 'rintsukiVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "Happy Birthday, Void!", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 2.7, english: "Happy Birthday (in japanese :D)", japanese: "お誕生日おめでとう。" },
            { time: 4.2, english: "Let's continue to get along! <3", japanese: "これからも、仲良くしようね。" },
            { time: 7.4, english: "Whether it's gaming or chatting or anything really, let's hangout with everyone again.", japanese: "また皆で、ゲームとか通話 とか何でもいいけど、 それで遊ぼうね" },
            { time: 11.2, english: "Hope you have a good year! Congrats again on turning 19 years old!", japanese: "いい一年にしてね 19才改めておめでとう！！" },
        ]
    },
    
    'Macs': {
        avatarName: "Macs",
        avatarKey: 'macsAvatar',
        avatarVoiceMessage: 'macsVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "Happy Birthday, Void!", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 3, english: "I hope your awesome weirdness shines all year long", japanese: "お誕生日おめでとう。" },
            { time: 6, english: "and may your “perfectly imperfect” English keep making us laugh and like you even more!", japanese: "これからも、仲良くしようね。" }
        ]
    },
    
    'Levenski': {
        avatarName: "Levenski",
        avatarKey: 'levenskiAvatar',
        avatarVoiceMessage: 'levenskiVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "hey Bro, I just wanted to say happy birthday and also did you know today was the day you were born?", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 6, english: "fuck I didn't know til you told me", japanese: "お誕生日おめでとう。" },
            { time: 9, english: "but hey, on a real note, I wanted to tell you that I hope you enjoy the day cause", japanese: "これからも、仲良くしようね。" },
            { time: 14, english: "it's your day and that I hope that you know a bright future comes", japanese: "また皆で、ゲームとか通話 とか何でもいいけど、 それで遊ぼうね" },
            { time: 20, english: "and I wanted to say that it's been real getting to know you and hang out whenever bro", japanese: "いい一年にしてね 19才改めておめでとう！！" },
            { time: 26, english: "if you ever need anything just hmu and i'll be here for you bro", japanese: "いい一年にしてね 19才改めておめでとう！！" },
            { time: 30, english: "anyways, happy birthday", japanese: "いい一年にしてね 19才改めておめでとう！！" },
        ] 
    },

    // HOWL - todo: video 
    
    'Anipha': {
        avatarName: "Anipha",
        avatarKey: 'aniphaAvatar',
        avatarVoiceMessage: 'aniphaVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "*anipha noises*", japanese: "*anipha noises*" },
            { time: 15, english: "Happy Birthday Void. お誕生日おめでとう bro", japanese: "お誕生日おめでとう。*2 bro" },
        ]
    },
    
    'Santru': {
        avatarName: "Santru",
        avatarKey: 'santruAvatar',
        avatarVoiceMessage: 'santruVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "誕生日 congratulations bro", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 3, english: "can't believe you're mười chín (19 in vietnameses) years old.", japanese: "お誕生日おめでとう。" },
            { time: 7, english: "fuck now you're unc 2", japanese: "これからも、仲良くしようね。" },
            { time: 10, english: "but seriously though, happy birthday dude", japanese: "また皆で、ゲームとか通話 とか何でもいいけど、 それで遊ぼうね" }
        ]
    },

    // TODO:  change these from voice to actual messages :3
    'Chris': {
        avatarName: "Chris",
        avatarKey: 'chrisAvatar',
        avatarVoiceMessage: null,
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "誕生日おめでとう, Dylan. I'm proud of you to reach the point of where you are now.", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 2.7, english: "Even if things have been hard, I'm glad you've kept going.  ", japanese: "お誕生日おめでとう。" },
            { time: 4.2, english: "Thank you for being there for me ever since I wanted to do this crazy ass dream to do this Japanese shit.", japanese: "これからも、仲良くしようね。" },
            { time: 7.4, english: "You've been a big influence on me, and everyone around you.", japanese: "また皆で、ゲームとか通話 とか何でもいいけど、 それで遊ぼうね" },
            { time: 11.2, english: " Your potential is limitless; happy birthday, brother.", japanese: "いいじゃんしてね！ 19才改めておめでとう！！" },
        ]
    },
    'Scarfy': {
        avatarName: "Scarfy",
        avatarKey: 'scarfyAvatar',
        avatarVoiceMessage: null,
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "Happy Birthday Void!!! We all love you. Good luck in Oregon. We’re always here for you.", japanese: "ハッピーバースデー、ヴォイド！" }
        ]
    },
    'Mel': {
        avatarName: "Mel",
        avatarKey: 'melAvatar',
        avatarVoiceMessage: null,
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "Hi void youre at my age now congrats ur still a kid", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 0.0, english: "youre still 17 have a good day happy birthday 🎉🎉🎉", japanese: "ハッピーバースデー、ヴォイド！" },
        ]
    },

    
};