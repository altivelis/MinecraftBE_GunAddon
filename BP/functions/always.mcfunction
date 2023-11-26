title @a times 0 60 10
scoreboard objectives add reload dummy
scoreboard objectives add reloading dummy
scoreboard objectives add ammo dummy
scoreboard objectives add shoot dummy
execute as @e[type=altivelis:revolver_bullet] at @s run particle minecraft:electric_spark_particle ~~~
execute as @e[type=altivelis:assult_bullet] at @s run particle minecraft:basic_crit_particle ~~~
execute as @e[type=altivelis:shotgun_bullet] at @s run particle minecraft:redstone_ore_dust_particle ~~~

scoreboard players add @a[scores={reloading=1}] reload 1
scoreboard players add @e[family=bullet] reload 1
kill @e[family=bullet,scores={reload=60}]