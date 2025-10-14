import Phaser from 'phaser';
import MainScene from './scenes/MainScene.js';
import GachaScene from './scenes/GachaScene.js';
import ArcheryScene from './scenes/ArcheryScene.js';

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [MainScene, GachaScene, ArcheryScene]
};

new Phaser.Game(config);
