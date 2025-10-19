export const quests = {
    talkedToNPCs: {
        'Risu': false,
        'Anipha': false,
        'Howl': false,
        'Levenski': false,
        'Luo': false,
        'Bumblebee': false,
        'Thighs': false,
        'Chris': false,
        'Rintsuki': false,
        'Macs': false,
        'Jorzi': false,
        'Santru': false,
        'Scarfy': false,
        'Mel': false
    },

    archeryComplete: false,
    gachaComplete: false
};

export function allComplete() {
    // todo: check why the option for talking to all npcs isn't working :< 
    const talkedToAllNPCs = Object.values(quests.talkedToNPCs).every(Boolean);
    return talkedToAllNPCs &&
        quests.archeryComplete &&
        quests.gachaComplete;
}

export function getMissingMessage() {
    // TODO: if time, add in voice messages 
    if (quests.archeryComplete===false) return ["You still need to complete the Archery Challenge.", "まだアーチェリーのチャレンジ を完成してないよ！"];
    if (quests.gachaComplete===false) return ["You still need get a 5 star from the Gacha Shrine.", "5starのプライズを 貰わなきゃいけないよ"];

    const talkedToAllNPCs = Object.values(quests.talkedToNPCs).every(Boolean);
    if (talkedToAllNPCs===false) return ["You still need to talk to all NPCs.", "全てのNPCと話しなきゃいけない！"];
}
