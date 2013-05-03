/**
 * @license iskvs v0.0.2
 * https://github.com/i-vetrov/iskvs
 *
 * Author: Ivan Vetrau (http://www.invatechs.com/)
 *
 * Copyright (C) 2013 Ivan Vetrau 
 * Licensed under the MIT license (MIT)
 **/

// iskvs client app

var net = require('net');
var events = require('events');
var crypto = require('crypto');
var _delimiter = '\n';
var _connected = false;
var _reconnect = {
  reconnect: true,
  timeout: 5000,
  attempts: 10,
  attemptsLeft: 10
};
var client;
var Events = function(){};
Events.prototype = new events.EventEmitter;
var emitter = new Events();
emitter.setMaxListeners(1000);

function generateId() {
  var rand = new Buffer(15);
  if (!rand.writeInt32BE) {
    return Math.abs(Math.random() * Math.random() * Date.now() | 0).toString()
      + Math.abs(Math.random() * Math.random() * Date.now() | 0).toString();
  }
  rand.writeInt32BE(0, 11);
  if (crypto.randomBytes) {
    crypto.randomBytes(12).copy(rand);
  } else {
    [0, 4, 8].forEach(function(i) {
      rand.writeInt32BE(Math.random() * Math.pow(2, 32) | 0, i);
    });
  }
  return rand.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}

function clientParseData(data) {
  data.split(_delimiter).forEach(function(d){
    if(d != '') {
      d = JSON.parse(d);
      emitter.emit(d.id, d);
    }
  });
}

function doReconnect(options) {
  if(_reconnect.reconnect == true && _reconnect.attemptsLeft !== 0) {
    _reconnect.attemptsLeft--;
    setTimeout(function(){
      doConnect(options);
    }, _reconnect.timeout);
  } else if(_reconnect.attemptsLeft === 0) {
    console.log("iskvs-client: no more reconnect attempts");
  }
}

function doConnect(options, onconnect) {
  client = net.connect(options, function() {
    _connected = true;
    var chunk = "";
    client.on('data', function(data){
      chunk += data.toString();
      var d_index = chunk.lastIndexOf(_delimiter);
      clientParseData(chunk.substring(0, d_index));
      chunk = chunk.substring(d_index + _delimiter.length);
    });
    client.on('close', function(err){
      _connected = false;
      doReconnect(options, onconnect);
      if(err) {
        console.log("iskvs-client: server closed connection with error: " + err)
      }
      else {
        console.log("iskvs-client: server closed connection")
      }
    });
  }).on('error', function(err){
      _connected = false;
      console.log("iskvs-client: error occurred: "+ err.code);
      doReconnect(options);
  }).on('connect', function(){
    if(onconnect) {
      onconnect();
    }
  });
}

function fireCallback(data, callback) {
  if(typeof callback == 'function') {
    if(data.error) {
      callback(data.error, null);
    }
    else if(data.data) {
      callback(null, data.data.value);
    }
    else {
      callback(null, data.success);
    }
  }
}

function clientGet(key, callback) {
  var id = generateId();
  emitter.once(id, function(data) {
    fireCallback(data, callback);
  });
  var request = {
    id: id,
    command: 'get',
    key: key
  };
  client.write(JSON.stringify(request) + _delimiter);

}

function clientSet(key, value, callback) {
  var id = generateId();
  emitter.once(id, function(data){
    fireCallback(data, callback);
  });
  var request = {
    id: id,
    command: 'set',
    key: key,
    value: value
  }
  client.write(JSON.stringify(request) + _delimiter);
}

function clientDel(key, callback) {
  var id = generateId();
  emitter.once(id, function(data){
    fireCallback(data, callback);
  });
  var request = {
    id: id,
    command: 'del',
    key: key
  }
  client.write(JSON.stringify(request) + _delimiter);
}

function clientClr(callback) {
  var id = generateId();
  emitter.once(id, function(data){
    fireCallback(data, callback);
  });
  var request = {
    id: id,
    command: 'clr'
  }
  client.write(JSON.stringify(request ) + _delimiter);
}

function fireRequest(request, key, value, callback) {
  if(!_connected) {
    fireCallback({error:'noconnection'}, callback);
  }
  else {
    switch(request) {
      case "get":
        clientGet(key, callback);
        break;
      case "set":
        clientSet(key, value, callback);
        break;
      case "del":
        clientDel(key, callback);
        break;  
      case "clr":
        clientClr(callback);
        break;
      default: break;
    }
  }
}

var Iskvs = function(options, onconnect) {
  doConnect(options, onconnect);
  this.get = function(key, callback){
    fireRequest('get', key, undefined, callback)
  };
  this.set = function(key, value, callback){
    fireRequest('set', key, value, callback)
  };
  this.del = function(key, callback){
    fireRequest('del', key, undefined, callback)
  };
  this.clr = function(callback){
    fireRequest('clr', undefined, undefined,  callback)
  };
}

module.exports.Client = function(options, reconnect, onconnect) {
  if(reconnect && typeof reconnect !== 'function') {
    if(reconnect.reconnect !== undefined) {
      _reconnect.reconnect = reconnect.reconnect;
    }
    if(reconnect.timeout !== undefined) {
      _reconnect.timeout = reconnect.timeout;
    }
    if(reconnect.attempts !== undefined) {
      _reconnect.attempts = reconnect.attempts;
      _reconnect.attemptsLeft = _reconnect.attempts;
    }
  }
  else if(typeof rec === 'function'){
    onconnect = reconnect;
  }
  return new Iskvs(options, onconnect)
}