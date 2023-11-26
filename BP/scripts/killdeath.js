import * as mc from "@minecraft/server";
import { runCommand, runPlayer, runWorld } from "./runCommand";

/**
 * 
 * @param {import('@minecraft/server').Entity} killer
 * @param {import('@minecraft/server').Entity} hurter
 * @param {Boolean} headshot
 */
export function killPlayer(killer,hurter,headshot){
    let name = (hurter.typeId=="minecraft:player")?hurter.nameTag:hurter.typeId.slice(10);
    //runPlayer(killer,`titleraw @s actionbar {"rawtext":[{"text":"${(headshot)?"\ue10a":"\ue109"}§c${name}"}]}`);
    killer.onScreenDisplay.setActionBar(`${(headshot)?"\ue10a":"\ue109"}§c${name}`);
    //runWorld(killer.dimension.id,`tellraw @a {"rawtext":[{"text":"§l§b${killer.nameTag}\ue106§c${name}${(headshot)?"\ue10a":"\ue109"}"}]}`);
    mc.world.sendMessage(`§l§b${killer.nameTag}\ue106§c${name}${(headshot)?"\ue10a":"\ue109"}`);
}