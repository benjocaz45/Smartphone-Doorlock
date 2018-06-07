#!/usr/bin/env node

//*** SMARTPHONE DOORLOCK ***//

// ************* PARAMETERS *************** //
// 
// Parameters: unlockedState and lockedState
// These parameters are in microseconds.
// The servo pulse determines the degree 
// at which the horn is positioned. In our
// case, we get about 100 degrees of rotation
// from 1ms-2.2ms pulse width. You will need
// to play with these settings to get it to
// work properly with your door lock
//
// Parameters: motorPin
// The GPIO pin the signal wire on your servo
// is connected to
//
// Parameters: buttonPin
// The GPIO pin the signal wire on your button
// is connected to. It is okay to have no button connected
//
// Parameter: blynkToken
// The token which was generated for your blynk
// project
//
// **************************************** //
var unlockedState = 1000;
var lockedState = 2200;

var motorPin = 14;
var buttonPin = 4;
var OLledPin = 17; //Outside Locked (red) led indicator
var OUledPin = 27; //Outside UNLocked (green) led indicator
var ILledPin = 23; //Inside Locked (red) led indicator
var IUledPin = 18; //Inside UNLocked (green) led indicator

var blynkToken = 'your-auth-token';

// *** Start code *** //

var locked = true;

//Setup servo
var Gpio = require('pigpio').Gpio,
  motor = new Gpio(motorPin, {mode: Gpio.OUTPUT}),
  button = new Gpio(buttonPin, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.FALLING_EDGE
  }),
  OLled = new Gpio(OLledPin, {mode: Gpio.OUTPUT});
  OUled = new Gpio(OUledPin, {mode: Gpio.OUTPUT});
  ILled = new Gpio(ILledPin, {mode: Gpio.OUTPUT});
  IUled = new Gpio(IUledPin, {mode: Gpio.OUTPUT});
//Setup blynk
var Blynk = require('blynk-library');
var blynk = new Blynk.Blynk(blynkToken);
var v0 = new blynk.VirtualPin(0);
var v1 = new blynk.VirtualPin(1);

console.log("locking door");
lockDoor();

button.on('interrupt', function (level) {
	console.log("level: " + level + " locked: " + locked);
	if (level == 0) {
		if (locked) {
			unlockDoor();
		} else {
			lockDoor();
		}
	}
});

v0.on('write', function(param) {
	console.log('V0:', param);
  	if (param[0] === '0') { //unlocked
  		unlockDoor();
  	} else if (param[0] === '1') { //locked
  		lockDoor();
  	} else {
  		blynk.notify("Door lock button was pressed with unknown parameter");
  	}
});

blynk.on('connect', function() { console.log("Blynk ready."); });
blynk.on('disconnect', function() { console.log("DISCONNECT"); });

//v1.on('write', function() {
//    if (locked) {
//        ILled.digitalWrite(1);
//        setTimeout(function(){ILled.digitalWrite(0)}, 2000);
//    } else { //if unlocked
//        IUled.digitalWrite(1); //sets inside unlock indicator (green) high
//        setTimeout(function(){IUled.digitalWrite(0)}, 2000); //sets inside unlock indicator (green) low after 2 seconds
//    }
//setTimeout(function(){blynk.virtualWrite(v1, 0)},1000);
//});

function lockDoor() {
	motor.servoWrite(lockedState);
	OLled.digitalWrite(1); //Sets outside lock indicator (red) high
	OUled.digitalWrite(0); //Sets outside unlock indicator (green) low
	ILled.digitalWrite(1); //Sets inside lock indicator (red) high
	IUled.digitalWrite(0); //Sets inside unlock indicator (green) low
	setTimeout(function(){ILled.digitalWrite(0)}, 2000); //Waits 2 seconds, then sets inside lock indicator (red) low
	locked = true;

	//notify
  	blynk.notify("Door has been locked!");
  	
  	//After 1.5 seconds, the door lock servo turns off to avoid stall current
  	setTimeout(function(){motor.servoWrite(0)}, 1500)
}

function unlockDoor() {
	motor.servoWrite(unlockedState);
	OLled.digitalWrite(0); //Sets outside lock indicator (red) low
	OUled.digitalWrite(1); //Sets outside unlock indicator (green) high
	ILled.digitalWrite(0); //Sets inside lock indocator (red) low
	IUled.digitalWrite(1); //Sets inside unlock indicator (green) high
	setTimeout(function(){IUled.digitalWrite(0)}, 2000); //shuts off inside unlock indicator (green) low after 2 seconds
	locked = false;

	//notify
  	blynk.notify("Door has been unlocked!"); 

  	//After 1.5 seconds, the door lock servo turns off to avoid stall current
  	setTimeout(function(){motor.servoWrite(0)}, 1500)
}
