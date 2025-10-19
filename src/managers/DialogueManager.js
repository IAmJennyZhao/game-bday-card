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
            { time: 0.0, english: "happy Birthday, void!", japanese: "ハッピーバースデー、ヴォイド！" },
            { time: 3, english: "congrats on hitting 19 years old. so awesome.", japanese: "19歳のお誕生日おめでとう。本当にすごいよ。" },
            { time: 7.2, english: "when you finish celebrating, we should play more freaking overwatch and hit diamond.", japanese: "お祝い終わったら、もっとオーバーウォッチやろうぜ。ダイヤモンドまで行こうぜ。" },
            { time: 12.5, english: "happy birthday femboyyyyy", japanese: "また皆で、ゲームとか通話 とか何でもいいけど、 それで遊ぼうね"}
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
            { time: 3, english: "I hope your awesome weirdness shines all year long", japanese: "あなたの素晴らしい奇妙さが一年中輝きますように" },
            { time: 6.5, english: "and may your “perfectly imperfect” English keep making us laugh and like you even more!", japanese: "そしてあなたの「完璧な不完全さ」が、これからも私たちを笑わせ、あなたをもっと好きにさせてくれますように！" }
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
            { time: 0.0, english: "hey Bro, I just wanted to say happy birthday and also did you know today was the day you were born?", japanese: "おい、bro、誕生日おめでとうって言いたかっただけなんだ。それと、今日がお前の誕生日だって知ってたか？" },
            { time: 6, english: "fuck I didn't know til you told me", japanese: "fuck、お前が言うまで知らなかったぜ" },
            { time: 9, english: "but hey, on a real note, I wanted to tell you that I hope you enjoy the day cause", japanese: "でもねえ、本音を言うと、今日は楽しんでほしいって伝えたくてさ。だって" },
            { time: 14.3, english: "it's your day and that I hope that you know a bright future comes", japanese: "今日はあなたの日だ。そして、輝かしい未来が訪れることを願っている" },
            { time: 20, english: "and I wanted to say that it's been real getting to know you and hang out whenever bro", japanese: "そして言いたかったのは、君と知り合って一緒に過ごせたのは本当に良かったってことだぜ、bro" },
            { time: 27, english: "if you ever need anything just hmu and i'll be here for you bro", japanese: "何か必要なことがあったらいつでも連絡してくれ、いつでも君の味方だぜbro" },
            { time: 30.3, english: "anyways, happy birthday", japanese: "とにかく、誕生日おめでとう" },
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
            { time: 0, english: "ah ah ah. is this thing on?", japanese: "あーあーあーこれ、オンになってる？" },
            { time: 10, english: "alright sick. anyway hi, how are you void?", japanese: "よし、イケてる??????? LMAO とにかく、やあ、元気？ボイド？" },
            { time: 20, english: "I heard your birthday is coming up, and I just wanted to say first and foremost Happy birthday. ", japanese: "誕生日が近いって聞いたよ。まずは何よりも。お誕生日おめでとうって言いたくて" },
            { time: 25, english: "and since, you know we've been friends for a minute. I just gotta say something. ", japanese: "それに、ほら。僕たち、結構長い間友達だし。言わなきゃいけないことがあるんだ" },
            // nah this is too long to put in one box probably future me can deal with it :DDDD
            { time: 30, english: "it's been a real honor to be your friend to play a few games with you and and it feels nice to just feel accepted in your server", japanese: "君の友達でいられて本当に光栄だよ。君といくつかのゲームをプレイできて。君のサーバーで受け入れられてるって感じるのが、すごく心地いいんだ" },
            { time: 35, english: "I don't know something sweet and embarrassing should be here. oh right um", japanese: "すごく心地いいんだ。何か甘くて恥ずかしい言葉を入れるべきなんだけどな。ああそうだ、えっと" },
            { time: 40, english: "you kind of are like a little brother to me, so I wanna like take care of you and like", japanese: "君って僕にとって弟みたいな存在なんだ、だから面倒見てあげたいし。" },
            { time: 45, english: "help you nurture and grow as a person, but I'm not gonna stop you from doing whatever you wanna do", japanese: "人間として育つ手助けもしたい、でも君のやりたいことや" },
            { time: 50, english: "and whatever choices you wanna make, you know you fuck around and find out, right?", japanese: "選ぶ道は絶対に止めたりしない。知ってるだろ？ ふざけてると痛い目見るって" },
            { time: 55, english: "that's how life is so, whatever you do, like, do it at 100% full force", japanese: "人生ってそういうものだから、何をするにしても、100%の力で全力でやって" },
            { time: 60, english: "and keep that same energy until the next year, and then the next year", japanese: "そのエネルギーを来年まで、その次の年まで持ち続けて" },
            { time: 65, english: "and just know that I'll be rooting for you. I'll be right behind you every step of the way", japanese: "ただ覚えておいて、僕は君を応援してるって。君の歩む道の、ずっと後ろで支えてるから" },
            // TODO: go ask someone else to read through this japanese i dont got that brain power rn 
            { time: 70, english: "that sounds creepy like I'm like stalking you it's not that, it's not weird I'm not trying to catch a case", japanese: "ちょっと気持ち悪いよね、まるでストーカーみたいだなんて思わないで、そんなことじゃないんだ、変じゃないよ、トラブル起こそうとしてるわけじゃないから" },
            { time: 75, english: "anyway um happy birthday! yeah! ああああああ", japanese: "とにかく、えっと、誕生日おめでとう！ やった！ああああああ" }
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
            { time: 0.0, english: "*anipha noises*", japanese: "*aniphaの音*" },
            { time: 15, english: "Happy Birthday Void. お誕生日おめでとう bro", japanese: "お誕生日おめでとう。*2 bro" },
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
            { time: 0.0, english: "お誕生日 congratulations bro", japanese: "お誕生日おめでとう bro" },
            { time: 3.7, english: "can't believe you're mười chín (19 in vietnameses) years old. holy fuck now you're unc 2", japanese: "信じられないよ、君が19歳(ベトナム語で）だなんて。マジかよ、もうunc 2かよ" },
            { time: 8.4, english: "but seriously though, happy birthday dude", japanese: "でもマジで、誕生日おめでとうよ、dude" }
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
            { time: 0.0, english: "誕生日おめでとう, Dylan. I'm proud of you to reach the point of where you are now.", japanese: "誕生日おめでとう、ディラン。今の君に誇りを感じているよ。" },
            { time: 2.7, english: "Even if things have been hard, I'm glad you've kept going.", japanese: "たとえ辛いことがあっても、あなたが諦めずに続けてくれて嬉しい。" },
            { time: 4.2, english: "Thank you for being there for me ever since I wanted to do this crazy ass dream to do this Japanese shit.", japanese: "このクレイジーな夢、日本語の道に進みたいと思った時からずっと支えてくれてありがとう。" },
            { time: 7.4, english: "You've been a big influence on me, and everyone around you.", japanese: "あなたは私やあなたの周りの皆に大きな影響を与えてきた。" },
            { time: 11.2, english: "Your potential is limitless; happy birthday, brother.", japanese: "君の可能性は無限大だ。お誕生日おめでとう、bro" },
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
            { time: 0.0, english: "Happy Birthday Void!!! We all love you. Good luck in Oregon. We’re always here for you.", japanese: "ヴォイド、お誕生日おめでとう！！！みんな君が大好きだよ。オレゴンでの幸運を祈ってる。いつでも君の味方だよ。" }
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
            { time: 0.0, english: "Hi void youre at my age now congrats ur still a kid", japanese: "やあボイド、お前も俺の年齢になったな、おめでとう、まだ子供だぜ" },
            { time: 0.0, english: "youre still 17 have a good day happy birthday 🎉🎉🎉", japanese: "まだ17歳だね良い一日をお誕生日おめでとう 🎉🎉🎉" },
        ]
    },

    
};