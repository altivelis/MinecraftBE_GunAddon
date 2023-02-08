import * as mc from "@minecraft/server";
import { runCommand, runPlayer, runWorld } from "./runCommand";

mc.world.events.projectileHit.subscribe(data=>{
    let {blockHit,dimension,entityHit,location,projectile,source} = data;
    if(entityHit){
        const hurter = entityHit.entity;
        const headshot = (location.y>=hurter.headLocation.y-0.2);
        let damage = (headshot)?10:5;
        hurter.applyDamage(damage,{cause:"suicide"});
        if(headshot){
            runPlayer(source,`playsound random.orb @s ~~~ 1 1.2 0`);
        }else{
            runPlayer(source,`playsound game.player.hurt @s ~~~ 0.5 1.5 0`)
        }
    }
})

mc.world.events.entitySpawn.subscribe(data=>{
    let entity = data.entity;
    if(entity.typeId!="minecraft:item")return;
    let item = entity.getComponent("item").itemStack;
    entity.nameTag=item.typeId
})

//デバッグを開始
//"/script debugger connect localhost 19144"