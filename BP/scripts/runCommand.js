import {
    world
} from "@minecraft/server";

/**
 * overworldでコマンド実行
 * @param {String} command 
 * @returns 
 */
export function runCommand(command){
    return world.getDimension("overworld").runCommandAsync(command);
}

/**
 * コマンド実行関数
 * @author altivelis1026
 * @param {import('@minecraft/server').dimension.id|string} dimension
 * @param {string} command
 */
export function runWorld(dimension,command){
    return world.getDimension(dimension).runCommandAsync(command);
}

/**
 * プレイヤーコマンド実行関数
 * @author altivelis1026
 * @param {import('@minecraft/server').Entity|import('@minecraft/server').Player} target
 * @param {string} command 
 */
export function runPlayer(target,command){
    return target.runCommandAsync(command);
}