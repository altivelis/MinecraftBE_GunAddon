import * as mc from "@minecraft/server";
import { runPlayer } from "./runCommand";


mc.system.runInterval(()=>{
  const playerList = mc.world.getAllPlayers();
  for(const player of playerList){
    if(player.hasTag("recall")) continue;
    if(!player?.recall){
      player.recall = new Array();
    }
    if(player.recall.length==50){
      player.recall.shift();
    }
    let pos = player.location;
    let rot = player.getRotation();
    let health = player.getComponent("health").current;
    player.recall.push({pos:pos,dim:player.dimension,rx:rot.x,ry:rot.y,hp:health});
  }
},2);

mc.world.events.itemUse.subscribe(data=>{
  const {item, source:player} = data;
  if(item.typeId!="altivelis:recall") return;
  if(player.getItemCooldown("recall")>0) return;
  player.addTag("recall");
  //item.getComponent("cooldown").startCooldown(player);
  player.startItemCooldown("recall",200);
  player.addEffect(mc.MinecraftEffectTypes.invisibility,50,0,false);
  player.addEffect(mc.MinecraftEffectTypes.resistance,50,100,false);
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
    player.teleport(recall.pos,recall.dim,recall.rx,recall.ry);
    player.getComponent("health").setCurrent(recall.hp);
  }
})