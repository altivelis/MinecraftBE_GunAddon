import * as mc from "@minecraft/server";
import { killPlayer } from "./killdeath";
import { runCommand, runPlayer, runWorld } from "./runCommand";
import { getScore } from "./score";
import "./recall";

const bulletList = [
    "altivelis:revolver_bullet",
    "altivelis:assult_bullet",
    "altivelis:shotgun_bullet"
];

mc.world.events.projectileHit.subscribe(data=>{
    const {dimension,location,projectile,source} = data;
    if(!bulletList.includes(projectile.typeId)) return;
    const blockHit=data.getBlockHit(), entityHit=data.getEntityHit();
    if(entityHit){
        const hurter = entityHit.entity;
        const headshot = (location.y>=hurter.getHeadLocation().y);
        let damage = (headshot)?10:5;
        switch(projectile.typeId){
            case "altivelis:revolver_bullet":damage=(headshot)?30:10;break;
            case "altivelis:assult_bullet":damage=(headshot)?30:8;break;
            case "altivelis:shotgun_bullet":damage=(projectile.hasTag("far"))?(headshot)?2:1:(headshot)?4:2;break;
        }
        //runPlayer(source,`tell @s ${damage}`);
        hurter.applyDamage(damage,
            {
                cause:mc.EntityDamageCause.suicide,
                damagingProjectile:projectile
            });
        if(headshot){
            runPlayer(source,`playsound random.orb @s ~~~ 1 1.2 0`);
            runPlayer(hurter,`particle minecraft:bleach ~~2~`);
        }else{
            runPlayer(source,`playsound game.player.hurt @s ~~~ 0.5 1.5 0`)
        }
        if(hurter.getComponent("health").current<=0.0){
            killPlayer(source,hurter,headshot);
        }
    }
    if(blockHit){
        runWorld(dimension.id,`particle minecraft:balloon_gas_particle ${location.x+0.0001} ${location.y+0.0001} ${location.z+0.0001}`);
    }
})

mc.system.events.scriptEventReceive.subscribe(data=>{
    if(data.id!="altivelis:ammo") return;
    const player = data.sourceEntity;
    const info = get_gun_info(player);
    const max = info.max;
    const damage = (data.message=="shoot")?info.damage+1:info.damage;
    const value = (player.usedAmmo)?max-damage-player.usedAmmo : max-damage;
    runPlayer(player,`titleraw @s times 0 60 10`);
    runPlayer(player,`titleraw @s title {"rawtext":[{"text":"\n\n\n\n\n§2${value}§7/${max}"}]}`);
    runPlayer(player,`scoreboard players set @s ammo ${damage+((player.usedAmmo>0)?player.usedAmmo:0)}`);
})

mc.system.events.scriptEventReceive.subscribe(data=>{
    if(data.id!="altivelis:reload") return;
    reload(data.sourceEntity);
})

function reload(player) {
    let { slot, item, lore, damage, max } = get_gun_info(player);
    /*if (remain < used) {
        runPlayer(player, `replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1 ${used - remain}`)
        item = get_gun_info(player).item;
        item.setLore([`0`])
    } else {
        runPlayer(player, `replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId} 1 0`);
        item = get_gun_info(player).item;
        item.setLore([`${remain - used}`]);
    }*/
    runPlayer(player,`replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId}`);
    //player.getComponent("inventory").container.setItem(slot, item);
}

function reload_shotgun(player){
    let {item} = get_gun_info(player);
    item.getComponent("minecraft:durability").damage--;
    player.getComponent("inventory").container.setItem(player.selectedSlot,item);
    runPlayer(player,`playsound camera.take_picture @s ~~~ 1 1.6 0`);
    runPlayer(player,`scriptevent altivelis:ammo`);
}

mc.system.runInterval(()=>{
    const reloadingPlayers = Array.from(mc.world.getPlayers({scoreOptions:[{
        maxScore:1,minScore:1,objective:"reloading"
    }]}));
    for(let player of reloadingPlayers){
        if(player.getComponent("inventory").container.getItem(player.selectedSlot)?.typeId!="altivelis:shotgun") continue;
        const score = getScore(player,"reload");
        if(score%10==0 && score>0){
            reload_shotgun(player);
        }
    }
},1)

/**
 * 
 * @param {import('@minecraft/server').Player} player 
 * @returns slot:number,item:itemStack,lore:String[],damage:number,max:number
 */
function get_gun_info(player) {
    const s = player.selectedSlot;
    const i = player.getComponent("inventory").container.getItem(s);
    const l = i.getLore();
    const d = i.getComponent("minecraft:durability").damage;
    const m = i.getComponent("minecraft:durability").maxDurability;
    return {
        slot: s,
        item: i,
        lore: l,
        damage: d,
        max:m
    }
}

const chargeList = [
    "altivelis:assult"
];

mc.world.events.itemStartCharge.subscribe(data=>{
    if(!chargeList.includes(data.itemStack.typeId))return;
    const player = data.source;
    if(getScore(player,"reloading")==1)return;
    runPlayer(player,`tag @s add shooting`);
    const item = player.getComponent("inventory").container.getItem(player.selectedSlot);
    player.usedAmmo=0;
    player.equip={item:item,slot:player.selectedSlot};
    switch(item.typeId){
        case "altivelis:assult":
            shot(player);
            break;
    }
})

mc.world.events.itemStopCharge.subscribe(data=>{
    if(!chargeList.includes(data.itemStack.typeId))return;
    const player = data.source;
    if(!player.equip)return;
    runPlayer(player,`tag @s remove shooting`);
    runPlayer(player,`scoreboard players reset @s shoot`);
    player.equip.item.getComponent("minecraft:durability").damage+=player.usedAmmo;
    player.getComponent("inventory").container.setItem(player.equip.slot,player.equip.item);
    player.usedAmmo=0;
    player.equip=null;
})

mc.system.runInterval(()=>{
    const players = Array.from(mc.world.getPlayers({tags:["shooting"]}));
    for(let player of players){
        if(!player.equip)return;
        const time = getScore(player,"shoot");
        const item = player.getComponent("inventory").container.getItem(player.selectedSlot);
        runPlayer(player,`scoreboard players add @s shoot 1`);
        switch(item.typeId){
            case "altivelis:assult":
                if(time>=3){
                    shot(player);
                    runPlayer(player,`scoreboard players set @s shoot 0`);
                }
                break;
        }
    }
},0)

/**
 * 
 * @param {import('@minecraft/server').Player} player 
 */
function shot(player){
    const info = get_gun_info(player);
    const value = info.max-info.damage-player.usedAmmo;
    if(value==0){
        switch(info.item.typeId){
            case "altivelis:assult":
                runPlayer(player,`playsound random.click @s ~~~ 1 0.8 1`);
                runPlayer(player,`scriptevent altivelis:ammo`);
                break;
        }
    }else if(value>0){
        switch(info.item.typeId){
            case "altivelis:assult":
                runPlayer(player,`camerashake add @s 1.5 0.1 positional`);
                player.triggerEvent("shoot_assult");
                player.usedAmmo++;
                runPlayer(player,`scriptevent altivelis:ammo`);
                recoil(player);
        }
    }
}

/**
 * 
 * @param {import('@minecraft/server').Player} player 
 */
function recoil(player) {
    return;
    let slot = player.selectedSlot;
    let dx = player.getRotation().x;
    let dy = player.getRotation().y;
    switch (player.getComponent("inventory").container.getItem(slot).typeId) {
        case "altivelis:revolver": player.teleport(player.location, player.dimension, dx - 5, dy);
            break;
        case "altivelis:assult": player.teleport(player.location, player.dimension, dx - 2, dy);
            break;
        case "altivelis:shotgun": player.teleport(player.location, player.dimension, dx - 10, dy);
            break;
        case "altivelis:sniper": player.teleport(player.location, player.dimension, dx - 1, dy);
            break;
    }
}

mc.world.events.dataDrivenEntityTriggerEvent.subscribe(data=>{
    const {entity,id} = data;
    switch(id){
        case "shoot_shotgun":
        case "shoot_revolver":mc.system.run(()=>{
            recoil(entity);
        });break;
    }
})

mc.world.events.itemUse.subscribe(data=>{
    const {item, source:player} = data;
    if(item.typeId!="minecraft:stick")return;
    const dr = player.getViewDirection();
    const rt = player.getRotation();
    player.applyKnockback(dr.x,dr.z,(90-Math.abs(rt.x))*0.06,(-rt.x)*0.025);
})

mc.world.events.projectileHit.subscribe(data=>{
    const {dimension,location,projectile,source} = data;
    if(projectile.typeId!="minecraft:arrow")return;
    const blockHit=data.getBlockHit(), entityHit=data.getEntityHit();
    if(entityHit){
        const hurter = entityHit.entity;
        let s_loc = source.location, h_loc = hurter.location;
        let dx = s_loc.x-h_loc.x,
            dy = s_loc.y-h_loc.y,
            dz = s_loc.z-h_loc.z;
        hurter.applyKnockback(dx,dz,Math.sqrt(Math.pow(dx,2)+Math.pow(dz,2))*0.4,(dy<0)?0.5:(Math.sqrt(dy)*0.5<0.5)?0.5:Math.sqrt(dy)*0.5);
    }
    if(blockHit){
        let s_loc = source.location,
            dx = location.x - s_loc.x,
            dy = location.y - s_loc.y,
            dz = location.z - s_loc.z;
        source.applyKnockback(dx,dz,Math.sqrt(Math.pow(dx,2)+Math.pow(dz,2))*0.4,(dy<0)?0.5:(Math.sqrt(dy)*0.5<0.5)?0.5:Math.sqrt(dy)*0.5);
    }
})

//デバッグを開始
//"/script debugger connect localhost 19144"



function getProperties(obj) {
    var properties = '';
    for (var prop in obj) {
        properties += prop + ': ' + obj[prop] + '\n';
    }
    return properties;
}

