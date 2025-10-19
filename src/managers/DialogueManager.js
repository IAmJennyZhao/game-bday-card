export default class DialogueManager {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.dialogueBox = null;
        this.avatar = null;
        this.textEnglish = null;
        this.textJapanese = null;
        this.choiceButtons = [];
        this.keyListener = null;
        this.interactText = null;

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
        this.interactText = this.scene.add.text(800, 970, 'Press Space to Continue', { font: '32px monospace', fill: '#fff', backgroundColor: 'rgba(184, 151, 98, 0.52'}).setDepth(106);
        
        this.dialogueBox.setVisible(false);
        if (this.avatar) this.avatar.setVisible(false);
        this.textName.setVisible(false);
        this.textEnglish.setVisible(false);
        if (this.textJapanese) this.textJapanese.setVisible(false);
        this.interactText.setVisible(false);
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
            this.interactText.setVisible(false);

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
        this.interactText.setVisible(false);

        if (!choices) {
            // No choices: wait for space again to continue
            this.interactText.setVisible(true);
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
                    this.interactText.setVisible(false);
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
        if (this.interactText) this.interactText.setVisible(false);
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
            { time: 0.0, english: "happy Birthday, void!", japanese: "voidくん、お誕生日おめでとう！" },
            { time: 3, english: "congrats on hitting 19 years old. so awesome.", japanese: "19歳か！すごいじゃん！" },
            { time: 7.2, english: "when you finish celebrating, we should play more freaking overwatch and hit diamond.", japanese: "お祝いが落ち着いたら、また一緒にオーバーウォッチやろうぜ。ダイヤまで行こう！" },
            { time: 12.5, english: "happy birthday femboyyyyy", japanese: "お誕生日おめでとう、フェムボーイ！"}
            
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
            { time: 3, english: "I hope your awesome weirdness shines all year long", japanese: "君の最高に変わったところが、1年中ずっと輝きますように！" },
            { time: 6.5, english: "and may your “perfectly imperfect” English keep making us laugh and like you even more!", japanese: "あと、その“完璧に不完全な”英語でこれからもみんなを笑わせて、もっと好きにさせてね！" }
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
            { time: 0.0, english: "hey Bro, I just wanted to say happy birthday and also did you know today was the day you were born?", japanese: "やっほー！誕生日おめでとう！てか今日お前の誕生日だったの知ってた？w" },
            { time: 6, english: "fuck I didn't know til you told me", japanese: "言われるまで知らなかったわ。" },
            { time: 9, english: "but hey, on a real note, I wanted to tell you that I hope you enjoy the day cause", japanese: "でもマジで言いたいのは、今日は思いっきり楽しんでほしいってこと。" },
            { time: 14.3, english: "it's your day and that I hope that you know a bright future comes", japanese: "今日はお前の日だし、きっと明るい未来が待ってるよ。" },
            { time: 20, english: "and I wanted to say that it's been real getting to know you and hang out whenever bro", japanese: "こうして出会って、一緒に遊べて本当に嬉しい。" },
            { time: 27, english: "if you ever need anything just hmu and i'll be here for you bro", japanese: "何かあったらいつでも連絡してくれ。俺はずっと味方だからな。" },
            { time: 30.3, english: "anyways, happy birthday", japanese: "とにかく、誕生日おめでとう！" },
        ] 
    },

    // HOWL - todo: video 
    'Howl': {
        avatarName: "Howl",
        avatarKey: 'howlAvatar',
        avatarVoiceMessage: 'howlVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0, english: "ah ah ah. is this thing on?", japanese: "あーあー、マイク入ってる？" },
            { time: 10, english: "alright sick. anyway hi, how are you void?", japanese: "よし、OK。 えっと、とりあえずやっほー。 元気してる？ void？" },
            { time: 20, english: "I heard your birthday is coming up, and I just wanted to say first and foremost Happy birthday. ", japanese: "もうすぐ誕生日だって聞いたよ。 まず最初に言わせて。 誕生日おめでとう！" },
            { time: 25, english: "and since, you know we've been friends for a minute. I just gotta say something. ", japanese: "それと、もう友達になってけっこう経つし、 少し真面目なことも言わせて。" },
            { time: 30, english: "it's been a real honor to be your friend to play a few games with you", japanese: "voidの友達でいられること、本当に嬉しい。 一緒にゲームしたり、" },
            { time: 33, english: "and and it feels nice to just feel accepted in your server", japanese: "君のサーバーにいさせてもらえるのが。すごく楽しくてありがたい。" },
            { time: 35, english: "I don't know something sweet and embarrassing should be here. oh right um", japanese: "ここでなんか甘くて恥ずかしいことを言うべきなんだろうけど…あ、そうだな" },
            { time: 40, english: "you kind of are like a little brother to me, so I wanna like take care of you and like", japanese: "voidは俺にとって弟みたいな存在なんだ。だから、これからも支えていきたいし、" },
            { time: 45, english: "help you nurture and grow as a person, but I'm not gonna stop you from doing whatever you wanna do", japanese: "人としてもっと成長していくのを見守りたい。自分で選んで、失敗して、学んでいくのが人生だから。" },
            { time: 50, english: "and whatever choices you wanna make, you know you fuck around and find out, right?", japanese: "でも、やりたいことは自由にやっていいと思う。" },
            { time: 55, english: "that's how life is so, whatever you do, like, do it at 100% full force", japanese: "だから何をするにしても、全力でやって、" },
            { time: 60, english: "and keep that same energy until the next year, and then the next year", japanese: "その勢いのまま次の年も、その次の年も進んでいってくれ。" },
            { time: 65, english: "and just know that I'll be rooting for you. I'll be right behind you every step of the way", japanese: "俺はその背中をずっと応援してるよ。" },
            { time: 70, english: "that sounds creepy like I'm like stalking you it's not that, it's not weird I'm not trying to catch a case", japanese: "……って言うとちょっとストーカーっぽいなw。そんな意味じゃないから安心して！" },
            { time: 75, english: "anyway um happy birthday! yeah! ああああああ", japanese: "とにかく——、誕生日おめでとう！！🎂" }
        ] 
    },
    
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
            { time: 0.0, english: "*anipha noises*", japanese: "*（アニファの謎の音）*" },
            { time: 15, english: "Happy Birthday Void. お誕生日おめでとう bro", japanese: "お誕生日おめでとう、void!おめでとうおめでとう！！" },
        ]
    },
    
    'Jorzi': {
        avatarName: "Jorzi",
        avatarKey: 'jorziAvatar',
        avatarVoiceMessage: 'jorziVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        // TODO: translate jorzi's message to japanese
        subtitles: [
            { time: 0.0, english: "Yo it's me jorz. so yeah, happy birthday void!", japanese: "*aniphaの音*" },
            { time: 5, english: "I actually have no idea how old you are going to be this year but (old -risu)", japanese: "お誕生日おめでとう。x2 bro" },
            { time: 10, english: "yea anyways, there's only one thing I want to say to you", japanese: "お誕生日おめでとう。x2 bro" },
            { time: 16, english: "and that is KEEP GRINDING ON YOUR ENGRISH (peace)", japanese: "お誕生日おめでとう。x2 bro" },
        ]
    },
    
    'Thighs': {
        avatarName: "Thighs",
        avatarKey: 'thighsAvatar',
        avatarVoiceMessage: 'thighsVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            // TODO: WHAY I THE FUCKS IS IT SO LONG ASLDKJF;LKASJ D maybe i just give up on subtitleing it bro as;dlkfja;dflks
            { time: 0.0, english: "お誕生日 congratulations bro", japanese: "お誕生日おめでとう bro" },
            { time: 3.7, english: "can't believe you're mười chín (19 in vietnameses) years old. holy fuck now you're unc 2", japanese: "信じられないよ、君が19歳(ベトナム語で）だなんて。マジかよ、もうunc 2かよ" },
            { time: 8.4, english: "but seriously though, happy birthday dude", japanese: "でもマジで、誕生日おめでとうよ、dude" }
        ]
    },

    // be back later ima eat dinner :DD
    
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
            { time: 0.0, english: "お誕生日 congratulations bro", japanese: "お誕生日おめでとう、bro！" },
            { time: 3.7, english: "can't believe you're mười chín (19 in vietnameses) years old. holy fuck now you're unc 2", japanese: "お前がもう19歳だなんて信じられねぇ！（ベトナム語）マジかよ、もうおじさん2号かw" },
            { time: 8.4, english: "but seriously though, happy birthday dude", japanese: "でも本当に、誕生日おめでとう！" }
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
            { english: "誕生日おめでとう, Dylan. I'm proud of you to reach the point of where you are now.", japanese: "誕生日おめでとう、Dylan！今の君を本当に誇りに思ってるよ。" },
            { english: "Even if things have been hard, I'm glad you've kept going.", japanese: "辛いことがあっても、諦めずに前に進んでくれて嬉しい。" },
            { english: "Thank you for being there for me ever since I wanted to do this crazy ass dream to do this Japanese shit.", japanese: "俺がこの“クレイジーな日本語の夢”を追い始めた時から、ずっと支えてくれてありがとう。" },
            { english: "You've been a big influence on me, and everyone around you.", japanese: "君は俺にも、周りのみんなにもすごく大きな影響を与えてきた。" },
            { english: "Your potential is limitless; happy birthday, brother.", japanese: "君の可能性は無限大だ。お誕生日おめでとう！" },
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
            { english: "Happy Birthday Void!!! We all love you.", japanese: "void誕生日おめでとう！！！みんな君のことが大好きだよ。" },
            { english: "Good luck in Oregon. We’re always here for you.", japanese: "オレゴン州でも頑張って！俺たちはいつでも応援してるからね" }
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
            { english: "Hi void youre at my age now congrats ur still a kid", japanese: "やあvoid、ついにお前も俺と同い年か！おめでとう！でもまだガキだな（笑）" },
            { english: "youre still 17 have a good day happy birthday 🎉🎉🎉", japanese: "楽しい一日を！誕生日おめでとう 🎉🎉🎉" },
        ]
    },

    
};