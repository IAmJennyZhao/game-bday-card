export default class EndingScene extends Phaser.Scene {
    constructor() { super('EndingScene'); }

    create() {
        this.cameras.main.fadeIn(1000);
        this.add.text(280, 240, 'Happy Birthday', { font: '32px monospace', fill: '#fff' });
        this.add.text(260, 280, 'Congrats on getting one day older, unc.', { font: '18px monospace', fill: '#fff' });
    }
}
