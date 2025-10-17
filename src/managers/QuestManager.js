export const quests = {
    talkedToNPCs: {
        'Rintsuki': false,
        'Levenski': false,
        'Howl': false,
        'Santru': false
    },

    archeryComplete: false,
    gachaComplete: false
};

export function allComplete() {
    let talkedToAllNPCs = true;
    for (const npcTalkedTo in Object.values(quests.talkedToNPCs)) {
        talkedToAllNPCs = talkedToAllNPCs && npcTalkedTo;
    }
    return talkedToAllNPCs &&
        quests.archeryComplete &&
        quests.gachaComplete;
}

export function getMissingMessage() {
    // TODO: if time, add in voice messages 
    if (quests.archeryComplete===false) return ["You still need to complete the Archery Challenge.", "まだアーチェリーのチャレンジ を完成してないよ！"];
    if (quests.gachaComplete===false) return ["You still need get a 5 star from the Gacha Shrine.", "5starのプライズを 貰わなきゃいけないよ"];

    let talkedToAllNPCs = true;
    for (const npcTalkedTo in Object.values(quests.talkedToNPCs)) {
        talkedToAllNPCs = talkedToAllNPCs && npcTalkedTo;
    }

    if (talkedToAllNPCs===false) return ["You still need to talk to all NPCs.", "全てのNPCと話しなきゃいけない！"];
}
