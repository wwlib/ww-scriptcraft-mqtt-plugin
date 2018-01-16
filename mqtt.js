console.log('loading mqtt.js');

var utils = require('utils');
var Drone = require('drone');



var mqtt = require('sc-mqtt');
var client = mqtt.client('tcp://test.mosquitto.org:1883'); //,'ScMcServerClient'); // default is localhost 1883
//var client = mqtt.client('tcp://mqtt.sunny72.com:25780','ScMcServerClient'); // default is localhost 1883

var playerMovePreviousTime = 0;

var mqtt_topic = 'jmgx/from_server';
client.connect();

client.subscribe('jmgx/to_server');

client.onMessageArrived(function(topic, message){
   // handle incoming messages here.
   console.log('Mqtt: inbound message received');
   console.log(topic);
   var bytes = message.payload;
   console.log(String(bytes));
   console.log(message);

   var messageObj = JSON.parse(message);

   if (messageObj && messageObj.player && messageObj.event) {
       console.log(messageObj.player, messageObj.event);
       switch (messageObj.event) {
           case 'buildABoat':
            onBuildABoat(messageObj.player);
            break;
       }
   }
});

function onBuildACottage(player) {
    var d = new Drone(player);
    d.cottage();
}

function onBuildABoat(playerName) {
    var players = utils.players();
    var player = null;
    for (var i = 0;i < players.length; i++) {
        var tempPlayer = players[i];
        if (playerName == tempPlayer.name) {
            player = tempPlayer;
        }
    }
    if (player) {
        //player.location.world.spawnEntity(player.location,entities.boat());
        // Schedule a task to run in one second.
        console.log(__plugin);
        var task = server.scheduler.scheduleSyncDelayedTask(__plugin, function() {
            console.log('Executing task: buildABoat');
            var d = new Drone(player);
            d.up().spawn(entities.boat());
        }, 20 * 2);
        console.log('Task: ', task);
    }
}

var message_obj = {
  event: 'scriptcraftMqttReady'
}
var message_obj_str = JSON.stringify(message_obj);
client.publish(mqtt_topic,  // topic
               message_obj_str, // payload
               1,            // QoS (1 is send at least once)
               true );       // broker should retain message

// events.on('block.BlockBreakEvent', function (listener, event){
//   console.log('mqtt.js: sending minecraft/blockbreak');
//   client.publish(mqtt_topic,  // topic
//                  'blockbreak', // payload
//                  1,            // QoS (1 is send at least once)
//                  true );       // broker should retain message
// });

// events.blockDestroy( function( evt, cancel ) {
//   console.log('mqtt.js: events.blockDestroy');
//   echo(evt.player, evt.player.name + ' broke a block!');
// } );

events.playerMove( function(event) {

    var currentTime = new Date().getTime();
    if (currentTime - playerMovePreviousTime > 10000) {
        playerMovePreviousTime = currentTime;

        var block_type = String(event.getPlayer().getLocation().getBlock().getType());
        if (block_type == 'STATIONARY_WATER' || block_type == 'WATER' || block_type == 'SAND') {
            // player is in water
            var player_name = event.player.name;
            var message_obj = {
              event: 'playerInWater',
              player: player_name,
              data: {
                surface: 'WATER'
              }
            }
            var message_obj_str = JSON.stringify(message_obj);
            client.publish(mqtt_topic,  // topic
                           message_obj_str, // payload
                           1,            // QoS (1 is send at least once)
                           true );
        }
    }
});

events.blockBreak( function( event ) {
  var block = event.block;
  var player_name = event.player.name;
  var block_type = String(block.type);
  //console.log('BlockBreak: ' + player_name + ', ' + block_type);
  var message_obj = {
    event: 'blockBreak',
    player: player_name,
    data: {
      blocktype: block_type,
      location: {x:block.getX(),y:block.getY(),z:block.getZ()}
    }
  }
  var message_obj_str = JSON.stringify(message_obj);
  client.publish(mqtt_topic,  // topic
                 message_obj_str, // payload
                 1,            // QoS (1 is send at least once)
                 true );
});

events.blockPlace( function( event ) {
  var block = event.block;
  var player_name = event.player.name;
  var block_type = String(block.type);
  //console.log('BlockPlace: ' + player_name + ', ' + block_type);
  var message_obj = {
    event: 'blockPlace',
    player: player_name,
    data: {
      blocktype: block_type,
      location: {x:block.getX(),y:block.getY(),z:block.getZ()}
    }
  }
  var message_obj_str = JSON.stringify(message_obj);
  client.publish(mqtt_topic,  // topic
                 message_obj_str, // payload
                 1,            // QoS (1 is send at least once)
                 true );
});

events.playerJoin( function( event ) {
  console.log('mqtt.js: event.playerJoin', event.player);
  var player_name = event.player.name;
  var message_obj = {
    event: 'playerJoin',
    player: player_name,
    data: {}
  }
  var message_obj_str = JSON.stringify(message_obj);
  client.publish(mqtt_topic,  // topic
                 message_obj_str, // payload
                 1,            // QoS (1 is send at least once)
                 true );
});

events.playerQuit( function( event ) {
  console.log('mqtt.js: event.playerQuit', event.player);
  var player_name = event.player.name;
  var message_obj = {
    event: 'playerQuit',
    player: player_name,
    data: {}
  }
  var message_obj_str = JSON.stringify(message_obj);
  client.publish(mqtt_topic,  // topic
                 message_obj_str, // payload
                 1,            // QoS (1 is send at least once)
                 true );
});

// events.playerDeath( function( event ) {
//   console.log('playerDeath:' + event.entity);
//   var message_obj = {
//     event: 'playerDeath',
//     entity: event.entity
//   }
//   var message_obj_str = JSON.stringify(message_obj);
//   client.publish(mqtt_topic,  // topic
//                  message_obj_str, // payload
//                  1,            // QoS (1 is send at least once)
//                  true );
// });

function onPlayerInteractEntity(event) {
    var message_obj = {
      event: 'playerInteractEntity',
      player: event.player.name,
      clickedEntity: event.clickedEntity,
      data: {}
    }
    var message_obj_str = JSON.stringify(message_obj);
    client.publish(mqtt_topic,  // topic
                   message_obj_str, // payload
                   1,            // QoS (1 is send at least once)
                   true );
}
events.playerInteractEntity(onPlayerInteractEntity);

function onPlayerEggThrow(event) {
    var message_obj = {
      event: 'playerEggThrow',
      player: event.player.name,
      data: {}
    }
    var message_obj_str = JSON.stringify(message_obj);
    client.publish(mqtt_topic,  // topic
                   message_obj_str, // payload
                   1,            // QoS (1 is send at least once)
                   true );
}
events.playerEggThrow(onPlayerEggThrow);


function onPlayerBedEnter(event) {
    var message_obj = {
      event: 'playerBedEnter',
      player: event.player.name,
      data: {}
    }
    var message_obj_str = JSON.stringify(message_obj);
    client.publish(mqtt_topic,  // topic
                   message_obj_str, // payload
                   1,            // QoS (1 is send at least once)
                   true );
}
events.playerBedEnter(onPlayerBedEnter);

function onPlayerBedLeave(event) {
    var message_obj = {
      event: 'playerBedLeave',
      player: event.player.name,
      data: {}
    }
    var message_obj_str = JSON.stringify(message_obj);
    client.publish(mqtt_topic,  // topic
                   message_obj_str, // payload
                   1,            // QoS (1 is send at least once)
                   true );
}
events.playerBedLeave(onPlayerBedLeave);


function onPlayerFish(event) {
    var message_obj = {
      event: 'playerFish',
      player: event.player.name,
      data: {}
    }
    var message_obj_str = JSON.stringify(message_obj);
    client.publish(mqtt_topic,  // topic
                   message_obj_str, // payload
                   1,            // QoS (1 is send at least once)
                   true );
}
events.playerFish(onPlayerFish);

function onCraftItem(event) {
    var message_obj = {
      event: 'craftItem',
      transaction: event.transaction,
      data: {}
    }
    var message_obj_str = JSON.stringify(message_obj);
    client.publish(mqtt_topic,  // topic
                   message_obj_str, // payload
                   1,            // QoS (1 is send at least once)
                   true );
}
events.craftItem(onCraftItem);
