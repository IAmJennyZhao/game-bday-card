import Phaser from 'phaser';
import MainScene from './scenes/MainScene.js';
import GachaScene from './scenes/GachaScene.js';
import ArcheryScene from './scenes/ArcheryScene.js';
import EndingScene from './scenes/EndingScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scale: {
        mode: Phaser.Scale.FIT, // or Phaser.Scale.ENVELOP
        parent: 'game-container', // The ID of your HTML div
        width: 1920, // Your game's original width
        height: 1080 // Your game's original height
    },
    scene: [MainScene, GachaScene, ArcheryScene, EndingScene]
};

new Phaser.Game(config);
