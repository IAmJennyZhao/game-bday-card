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

    async startDialogue(dialogues = [], onComplete = null) {
        if (!this.dialogueBox) this.createUI();

        this.dialogueBox.setVisible(true);
        if (this.avatar) this.avatar.setVisible(true);
        this.textName.setVisible(true);
        this.textEnglish.setVisible(true);
        if (this.textJapanese) this.textJapanese.setVisible(true);

        for (const line of dialogues) {
            await this.showLine(line);
        }
        if (onComplete) onComplete();

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
            { time: 7.2, english: "when you finish celebrating, we should play more freaking overwatch and hit diamond.", japanese: "お祝いが落ち着いたら、 また一緒にオーバーウォッチ やろうぜ。 ダイヤまで行こう！" },
            { time: 12.5, english: "happy birthday femboyyyyy", japanese: "お誕生日おめでとう、 フェムボーイ！"}
            
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
            { time: 0.0, english: "Happy Birthday, Void!", japanese: "ハッピーバースデー、 ヴォイド！" },
            { time: 3, english: "I hope your awesome weirdness shines all year long", japanese: "君の最高に変わったところが、 1年中ずっと輝きますように！" },
            { time: 6.5, english: "and may your “perfectly imperfect” English keep making us laugh and like you even more!", japanese: "あと、その“完璧に不完全な” 英語でこれからもみんな を笑わせて、 もっと好きにさせてね！" }
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
            { time: 0.0, english: "hey Bro, I just wanted to say happy birthday and also did you know today was the day you were born?", japanese: "やっほー！ 誕生日おめでとう！ てか今日お前の誕生日 だったの知ってた？w" },
            { time: 6, english: "fuck I didn't know til you told me", japanese: "言われるまで知らなかったわ。" },
            { time: 9, english: "but hey, on a real note, I wanted to tell you that I hope you enjoy the day cause", japanese: "でもマジで言いたいのは、 今日は思いっきり楽しんで ほしいってこと。" },
            { time: 14.3, english: "it's your day and that I hope that you know a bright future comes", japanese: "今日はお前の日だし、 きっと明るい未来が待ってるよ。" },
            { time: 20, english: "and I wanted to say that it's been real getting to know you and hang out whenever bro", japanese: "こうして出会って、 一緒に遊べて本当に嬉しい。" },
            { time: 27, english: "if you ever need anything just hmu and i'll be here for you bro", japanese: "何かあったらいつでも連絡 してくれ。 俺はずっと味方だからな。" },
            { time: 30.3, english: "anyways, happy birthday", japanese: "とにかく、誕生日おめでとう！" },
        ] 
    },
    
    'Luo': {
        avatarName: "Luo",
        avatarKey: 'luoAvatar',
        avatarVoiceMessage: 'luoVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0, english: "What's up Voiddddd", japanese: "やあ、Void！" },
            { time: 3.3, english: "My little brother, happy birthday to you!", japanese: "弟よ、誕生日おめでとう！" },
            { time: 9, english: "Yooo you keep getting older. ", japanese: "おいおい、 どんどん大人になっていくな。" },
            { time: 11, english: "But that's a good thing, that means you can do so many things", japanese: "でもそれはいいことだよ。 できることがたくさん 増えるからな。" },
            { time: 14, english: "You can try to make money then get some nice job ", japanese: "お金を稼いで、 いい仕事に就いたり、" },
            { time: 18, english: "You can make your dreams come true. ", japanese: "夢を叶えたりもできる。" },

            { time: 21, english: "Next time, we can keep playing games.", japanese: "今度またゲームしようぜ。" },
            { time: 24, english: "Next time is not only this year but next year I wish that we could just hangout for like forever", japanese: "今年だけじゃなく、 来年も、 その先もずっと一緒に 遊べたらいいな。" },
            { time: 30.6, english: "That sounds cool though right. Let's keep it happy", japanese: "最高だろ？  幸せでいようぜ。" },

            { time: 34, english: "If there's something that happened, just text me or tell me or tell Levenski or tell everybody", japanese: "何かあったら、 俺にメッセージするか、 Levenskiやみんなに話してくれ。" },
            { time: 40.7, english: "Everyone gonna help you and fix so many problems!", japanese: "みんなで助けて、 きっと解決できるから！" },
            { time: 43.7, english: "Wish we can help you though", japanese: "本当はもっと助けてあげたいよ。" },

            { time: 45.8, english: "I just wanna say happy birthday yoooo", japanese: "とにかく、 誕生日おめでとう！" },
            { time: 50.3, english: "Just be happy. Enjoy it", japanese: "笑って、楽しんでくれ。" },
            { time: 52, english: "and I think, you know, there's going to be so many things that happen in the future", japanese: "これから先、 いろんなことがあるだろうけど、" },
            { time: 57, english: "and I'm pretty sure so many good things ", japanese: "きっといいことばかりだよ。" },

            { time: 59.7, english: "and I wish one day we can meet each other in the real life then we can hang out", japanese: "いつか現実で会って、 一緒に遊べたら最高だな！" },
            { time: 64.2, english: "that's pretty cool though!! Happy Birthday!! ", japanese: "誕生日おめでとう、Void！！" }
        ] 
    },
    
    'Risu': {
        avatarName: "Risu",
        avatarKey: 'risuAvatar',
        avatarVoiceMessage: 'risuVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0, english: "hey void! i made this little site for your birthday and i hope you enjoy it!", japanese: "やあVoid！  君の誕生日にちょっとした サイトを作ってみたよ。 気に入ってくれたら嬉しい！" },
            { time: 5, english: "I'm not one to speak sweet sentimental words so I asked some of your friends to give you messages instead! ", japanese: "甘い言葉を言うのは苦手だから、 その代わりにみんなからの メッセージを集めたんだ！" },
            { time: 11.5, english: "Talk to everyone, go to the shrine to play gacha, and go to the archery range for aim practice. ", japanese: "みんなと話したり、 神社でガチャを引いたり、 射的場でエイム練習したりしてね" },
            { time: 17, english: "Once you're done you can head through the portal on the left :3", japanese: "終わったら左のポータルから出てね :3" },
            { time: 20, english: "Happy Birthday Void", japanese: "誕生日おめでとう、Void！" },
            { time: 22, english: "I can't wait to play more games with ya!", japanese: "また一緒にゲームできるのを 楽しみにしてる！" },
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
            { time: 4.5, english: "alright sick. anyway hi, how are you void?", japanese: "よし、OK。 えっと とりあえずやっほー。 元気してる？ void？" },
            { time: 11, english: "I heard your birthday is coming up, and I just wanted to say first and foremost Happy birthday. ", japanese: "もうすぐ誕生日だって聞いたよ。 まず最初に言わせて。 誕生日おめでとう！" },
            { time: 20, english: "and since, you know we've been friends for a minute. I just gotta say something. ", japanese: "それと、 もう友達になって けっこう経つし、 少し真面目なことも 言わせて。" },
            { time: 26, english: "it's been a real honor to be your friend to play a few games with you", japanese: "voidの友達でいられること、 本当に嬉しい。 一緒にゲームしたり、" },
            { time: 32, english: "and shoot the shit in vc and it feels nice to just feel accepted in your server", japanese: "君のサーバーに いさせてもらえるのが。 すごく楽しくてありがたい。" },
            { time: 43, english: "I don't know something sweet and embarrassing should be here. oh right um", japanese: "ここでなんか甘くて 恥ずかしいことを言う べきなんだろうけど …あ、そうだな" },
            { time: 50, english: "you kind of are like a little brother to me, so I wanna like take care of you and like", japanese: "voidは俺にとって 弟みたいな存在なんだ。 だから、 これからも支えていきたいし、" },
            { time: 54.5, english: "help you nurture and grow as a person, but I'm not gonna stop you from doing whatever you wanna do", japanese: "人としてもっと成長していく のを見守りたい。 自分で選んで、失敗して、 学んでいくのが人生だから。" },
            { time: 61.3, english: "and whatever choices you wanna make, you know you fuck around and find out, right?", japanese: "でも、やりたいことは 自由にやっていいと思う。" },
            { time: 67.5, english: "that's how life is so, whatever you do, like, do it at 100% full force", japanese: "だから何をするにしても、 全力でやって、" },
            { time: 74, english: "and keep that same energy until the next year, and then the next year", japanese: "その勢いのまま次の年も、 その次の年も進んで いってくれ。" },
            { time: 80, english: "and just know that I'll be rooting for you. I'll be right behind you every step of the way", japanese: "俺はその背中をずっと 応援してるよ。" },
            { time: 87.5, english: "that sounds creepy like I'm like stalking you it's not that, it's not weird I'm not trying to catch a case", japanese: "……って言うとちょっと ストーカーっぽいなw。 そんな意味じゃないから 安心して！" },
            { time: 93.7, english: "anyway um happy birthday! yeah! ああああああ", japanese: "とにかく——、 誕生日おめでとう！！🎂" }
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
            { time: 15, english: "Happy Birthday Void. お誕生日おめでとう bro", japanese: "お誕生日おめでとう、 void!おめでとうおめでとう！！" },
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
            { time: 0.0, english: "Yo it's me jorz. so yeah, happy birthday void!", japanese: "おーい、俺だjorzi。 誕生日おめでとう" },
            { time: 4.4, english: "I actually have no idea how old you are going to be this year but", japanese: "正直、お前が今年で 何歳になるのか全然知らねえ, けどw" },
            { time: 9.7, english: "yea anyways, there's only one thing I want to say to you", japanese: "まあ、それはさておき、 言いたいことは一つだけ。" },
            { time: 17, english: "and that is KEEP GRINDING ON YOUR ENGRISH (peace)", japanese: "英語の勉強、 ちゃんと続けろよ！✌️" },
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
            { time: 0.0, english: "Hi Void! Hello male wife! Happy Birthday Dylan af", japanese: "やあ、void！ 男嫁さん、こんにちは！。 誕生日おめでとう" },
            { time: 5.8, english: "you've officially reached unc status. you're a fucking boomer now.", japanese: "お前、ついに“おじ” の域に達したな。 もう完全にブーマーだぜw " },
            { time: 11.5, english: "I know you've been through a lot in your life", japanese: "君はこれまで本当にいろんな ことを経験してきたし、" },
            { time: 14, english: "and you're still struggle with a lot of things you know", japanese: "今でもいろんな悩み を抱えてると思う。" },
            { time: 17, english: "especially in the past few years but you know in the 3.5 soon to be 4 years that I've been you're friend", japanese: "特にこの数年間、 でもこの3年半 （もうすぐ4年）で、" },
            { time: 22.5, english: "I've seen you grow so much I see you be able to get through a lot", japanese: "君がどれだけ成長してきたか、 ずっと見てきたよ。" },

            { time: 29, english: "and yeah you've made it this far so that means you know 100% success rate", japanese: "ここまで来たってことは、 つまり“成功率100%” ってことだ。" },
            { time: 33.2, english: "you've gotten through everything life's thrown at you", japanese: "人生でどんな 困難があっても、 全部乗り越えてきた。" },
            { time: 35.3, english: "and as gay as it sounds i'm you know really proud of you af", japanese: "ちょっとクサい言い方 かもしれないけど、 本気で誇りに思ってる。" },

            { time: 40, english: "and I've seen you grow in so many ways that you wouldn't realize yourself", japanese: "君自身は気づいてない かもしれないけど" },
            { time: 44, english: "you've become a stronger person, a kinder person,", japanese: "君は本当に強くて優しくて、" },
            { time: 48.4, english: "more productive, more hard-working.", japanese: "前よりずっと頑張り屋で、 成長してるんだ。" },

            { time: 50.6, english: "I've seen you talk about working on a novel for years", japanese: "何年も前から小説の 話してたけど、" },
            { time: 51.4, english: "and now you're actually working on it and it's fucking good", japanese: "今は実際に書いてて、 それが本当にすごく良い" },
            { time: 55.8, english: "I've seen you improve a lot at singing and you know", japanese: "歌もめちゃくちゃ 上手くなったよな。" },
            { time: 62, english: "you were pretty mid and like at my level", japanese: "前はまあまあだったのに、 俺と同じレベルw" },

            { time: 65, english: "you know fucking Japanese people say you're fluent all the time", japanese: "日本人に「流暢だね」 って言われるのも納得だよ。" },
            { time: 68, english: "you're really good at Japanese and I've seen you make so many friendships", japanese: "本当に日本語上手いし、 友達もたくさんできた。" },
            { time: 73, english: "and there are people who genuinely care about you ", japanese: "心から君を大切に思って くれる人がたくさんいる。" },

            { time: 76, english: "and you know so so much more and I know it may not always be obvious to you ", japanese: "自分では分かりにくい かもしれないけど、" },
            { time: 81, english: "like I know I've seen it. I've seen your growth ", japanese: "君の成長を俺は ちゃんと見てきた。" },
            { time: 85, english: "and no matter how hard you are on yourself, it's there", japanese: "どんなに自分を責めても、 その成長は確かにそこにある。" },
            { time: 88, english: "and you know it's only going to be up from this point. ", japanese: "そして、ここからはもっと 良くなっていくだけだ。" },

            { time: 90, english: "There will be bumps and dips along the way", japanese: "道の途中でつまづくこと もあるだろうし、" },
            { time: 92, english: "you know you're still going to go through things", japanese: "これからも大変なこと はあると思う。" },
            { time: 94.3, english: "I'm still going to go through things, but what doesn't kill you makes you stronger", japanese: "でも、「死ななきゃ強くなる」 って言うだろ？" },
            { time: 98.7, english: "It's only up from here.", japanese: "ここからは上がって いくだけだ。" },

            { time: 101, english: "You're genuinely like my best friend.", japanese: "君は本当に、 俺にとって親友みたいな 存在だ。" },
            { time: 103, english: "My relationship with you has been so unique you know.", japanese: "俺たちの関係は特別で、 他の誰とも違う。" },
            { time: 105, english: "We're always bickering. We're always at each other's throats ", japanese: "よく言い合いもするし、" },
            { time: 108, english: "also fucking hitting on each other, making fun of each other", japanese: "ふざけ合ったり、 からかったりもするけど、" },
            { time: 114, english: "but you know, in like the best way possible", japanese: "全部いい意味でだよ。" },

            { time: 116, english: "but we're also confiding in each other and pushing each other to get through so fucking much", japanese: "お互いに支え合って、 いろんなことを 乗り越えてきた。" },
            { time: 122, english: "you know we're always helping each other and", japanese: "助け合って、 何でも話せる関係で、" },
            { time: 127, english: "you know we're so open in such a judgmental yet nonjudgmental way at the same time.", japanese: "遠慮なく笑い合えるのが 本当にいい。" },
            { time: 134, english: "We're both nonjudgmental of each other but we still make fun of each other.", japanese: "お互いを否定しないけど、 ちゃんと茶化し合える関係。" },
            { time: 137, english: "and it's fucking awesome you know. like it's such a unique relationship.", japanese: "それが最高なんだ。" },

            { time: 141, english: "and you know we've seen so much of each other's lives and each other's growth", japanese: "お互いの人生も成長も ずっと見てきた。" },
            { time: 145, english: "you've seen me go from a depressed shut in to all the drama that happened in high school", japanese: "俺が鬱で引きこもってた頃から、 高校時代のドタバタ、" },
            { time: 151.3, english: "to fucking graduating and all the struggles I face now", japanese: "卒業して今の苦労に至るまで。" },
            { time: 155.8, english: "and it's the same with you.", japanese: "君も同じように たくさんのことを 乗り越えてきた。" },

            { time: 157, english: "I've seen you go through high school ", japanese: "君が高校を卒業する までのことも、" },
            { time: 158.7, english: "I've seen friendships, relationships, shit with your family ", japanese: "友情、恋愛、 家族の問題も全部見てきた。" },
            { time: 162.6, english: "I've seen you go through it all and you mean so much to me.", japanese: "君は本当に大切な存在だし、" },
            { time: 166, english: "I genuinely care and worry about you a lot. I feel really comfortable with you.", japanese: "心から心配してるし、 君といると本当に落ち着く。" },

            { time: 171.5, english: "We're both weird and gay as fuck.", japanese: "俺たち、 二人とも変でちょっと ゲイっぽいけどw" },
            { time: 173.5, english: "We've done so much together.", japanese: "たくさんのことを 一緒に経験してきたよな。" },
            { time: 175.5, english: "You know whatever it is, fucking playing games, watching movies, ", japanese: "ゲームしたり、 映画観たり" },
            { time: 180, english: "being fucking weird, vrchat, fucking around with each other, playing overwatch recently,", japanese: "変なことしたり、 VRChatしたり、 オーバーウォッチやったり" },
            { time: 188, english: "whatever it is you know it's always fun with you, it's entertaining", japanese: "何をしてても、 君といると楽しいんだ。" },
            { time: 192, english: "you're funny, you're such a unique person and it's so enjoyable hanging around you", japanese: "本当におもしろいし、 特別な人だよ。" },

            { time: 201, english: "and you know I just really like the unique friendship and dynamic we've had", japanese: "君との友情や関係性は 本当に特別で" },
            { time: 205, english: "and it's different from any other friend I've had in a lot of ways.", japanese: "今までのどんな 友達とも違う。" },
            { time: 209.5, english: "I really hope we can stay lifelong friends and pushing each other's growth.", japanese: "これからもずっと、 お互いに成長を支え合える。 一生の友達でいたい。" },

            { time: 214.5, english: "I know you feel lonely and empty often and all these sorts of things", japanese: "君が時々孤独や虚しさを感じる のは分かってる。" },
            { time: 218, english: "but as much as it helps, you have so many great friends ", japanese: "でも君には、 本当に君を大事に思ってる" },
            { time: 223, english: "that really really care about you", japanese: "素晴らしい友達が たくさんいる。" },

            { time: 225, english: "I mean look at this huge setup", japanese: "見てみろよ、 この誕生日のための サプライズを。" },
            { time: 228, english: "that from Risu and all of your friends", japanese: "リスやみんなが君の ために用意したんだ。" },
            { time: 230, english: "that we've done for your birthday.", japanese: "たとえ君が自分に 厳しくしても、" },
            { time: 232, english: "People really do care about you even if you're sometimes hard on yourself.", japanese: "みんな本気で 君を大切に思ってる。" },

            { time: 237, english: "Sometimes it feels like you're alone but you're not. ", japanese: "ひとりぼっちに感じる 時もあるだろうけど、 本当は全然ひとりじゃない。" },
            { time: 240, english: "You have so much good people around you ", japanese: "君の周りには、 たくさんの良い人がいるんだ。" },

            { time: 242, english: "Anyways! I love you full homo you little gay fucking femboy", japanese: "とにかく！ 愛してるぜ、 ガチで （フルホモな意味でな笑）" },
            { time: 246, english: "Happy 19th Birthday Dylan! I hope you have an amazing next year", japanese: "ディラン、 19歳の誕生日おめでとう！" },
            { time: 250.4, english: "and the next of your life really. ", japanese: "来年も、 その先の人生も最高の年 になりますように。" },
            { time: 253, english: "Happy birthday! BYEEE", japanese: "誕生日おめでとう！ じゃあな！" }
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
            { time: 0.0, english: "お誕生日 congratulations bro", japanese: "お誕生日おめでとう、 bro！" },
            { time: 3.7, english: "can't believe you're mười chín (19 in vietnameses) years old. holy fuck now you're unc 2", japanese: "お前がもう19歳だなんて信じられねぇ！ （ベトナム語）マジかよ、 もうおじさん2号かw" },
            { time: 8.4, english: "but seriously though, happy birthday dude", japanese: "でも本当に、 誕生日おめでとう！" }
        ]
    },
    'Scarfy': {
        avatarName: "Scarfy",
        avatarKey: 'scarfyAvatar',
        avatarVoiceMessage: 'scarfyVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0, english: "Hey, what's up Void! Just wanted to tell you Happy Birthday you know.", japanese: "やっほー、Void！  誕生日おめでとう！" },
            { time: 4.8, english: "Just know that we all love you, and we wish you the best of luck moving to Oregon.", japanese: "みんな君のことを大好きだし、 オレゴンでの新しい 生活がうまくいくように 祈ってるよ。" },
            { time: 8.5, english: "I hope you like it there, ", japanese: "あっちが気に 入るといいな。" },
            { time: 9.5, english: "and know we'll always be here for you man.", japanese: "俺たちはいつでも 君の味方だからな。" },
            { time: 11.7, english: "Enjoy your birthday. Enjoy everything bro. Peace.", japanese: "今日は思いっきり楽しめよ。 全部満喫しろよ、 またね！" },
        ]
    },
    'Mel': {
        avatarName: "Mel",
        avatarKey: 'melAvatar',
        avatarVoiceMessage: 'melVoice',
        initialDialogue: {
            english: "Hey, Void! Long time no see.",
            japanese: "やあ、ヴォイド！久しぶりだね。",
            voiceKey: null
        },
        subtitles: [
            { time: 0.0,  english: "Happy Birthday, Void! I hope you have a peaceful day today!", japanese: "誕生日おめでとう、Void！ 今日は穏やかでいい 一日になりますように。" },
            { time: 7.0,  english: "Congratulations on the new age. Very proud of you.", japanese: "大人になったね。 本当に誇らしいよ。" },
            { time: 11.0,  english: "Keep growing, you're still a little kid to me though. Happy Birthday!", japanese: "成長していってね。 でも俺にとってはまだ子ども みたいなもんだけどな。 誕生日おめでとう！" },
        ]
    },

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
            { english: "誕生日おめでとう, Dylan. I'm proud of you to reach the point of where you are now.", japanese: "誕生日おめでとう、 Dylan！今の君を本当に 誇りに思ってるよ。" },
            { english: "Even if things have been hard, I'm glad you've kept going.", japanese: "辛いことがあっても、 諦めずに前に進んで くれて嬉しい。" },
            { english: "Thank you for being there for me ever since I wanted to do this crazy ass dream to do this Japanese shit.", japanese: "俺がこの“クレイジーな 日本語の夢”を追い始めた時から、 ずっと支えてくれてありがとう。" },
            { english: "You've been a big influence on me, and everyone around you.", japanese: "君は俺にも、 周りのみんなにも すごく大きな影響を与えてきた。" },
            { english: "Your potential is limitless; happy birthday, brother.", japanese: "君の可能性は無限大だ。 お誕生日おめでとう！" },
        ]
    },
};