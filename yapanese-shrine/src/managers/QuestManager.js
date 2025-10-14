export const quests = {
    talkedToRintsuki: false,
    talkedToGrassFriend: false,
    talkedToPicnic: false,
    talkedToBridgeFriend: false,
    archeryComplete: false,
    gachaComplete: false
};

export function allComplete() {
    return quests.talkedToRintsuki &&
        quests.talkedToGrassFriend &&
        quests.talkedToPicnic &&
        quests.talkedToBridgeFriend &&
        quests.archeryComplete &&
        quests.gachaComplete;
}
