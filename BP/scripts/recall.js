import * as mc from "@minecraft/server";
import { runPlayer } from "./runCommand";


mc.system.runInterval(()=>{
  const playerList = mc.world.getAllPlayers();
  for(const player of playerList){
    if(player.hasTag("recall")) continue;
    if(!player?.recall){
      player.recall = new Array();
    }
    if(player.recall.length==25){
      player.recall.shift();
    }
    let pos = player.location;
    let rot = player.getRotation();
    let health = player.getComponent(mc.EntityHealthComponent.componentId).currentValue;
    player.recall.push({pos:pos,dim:player.dimension,rx:rot.x,ry:rot.y,hp:health});
  }
},4);

mc.world.afterEvents.itemUse.subscribe(data=>{
  const {itemStack:item, source:player} = data;
  if(item.typeId!="altivelis:recall") return;
  if(player.getItemCooldown("recall")>0) return;
  player.addTag("recall");
  //item.getComponent("cooldown").startCooldown(player);
  player.startItemCooldown("recall",200);
  player.addEffect(mc.EffectTypes.get("invisibility"),50,{amplifier:0,showParticles:false});
  player.addEffect(mc.EffectTypes.get("resistance"),50,{amplifier:100,showParticles:false});
  console.log(player.recall);
  runPlayer(player,"particle minecraft:egg_destroy_emitter ~ ~ ~");
});

mc.system.runInterval(()=>{
  const playerList = mc.world.getAllPlayers();
  for(const player of playerList){
    if(!player.hasTag("recall")) continue;
    if(!player?.recall) continue;
    const recall = player.recall.pop();
    if(!recall){
      player.removeTag("recall");
      continue;
    }
    player.teleport(recall.pos,{dimension:recall.dim,rotation:{x:recall.rx,y:recall.ry}});
    player.getComponent(mc.EntityHealthComponent.componentId).setCurrentValue(recall.hp);
  }
})