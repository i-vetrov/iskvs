/**
 * @license iskvs v0.0.1
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
var delimiter = '\n';
var client;
var Events = function(){};
Events.prototype = new events.EventEmitter;
var emitter = new Events();
emitter.setMaxListeners(100);

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
  data.split(delimiter).forEach(function(d){
    if(d != '') {
      try {
        d = JSON.parse(d);
        emitter.emit(d.id, d);
      }
      catch (e) {
        emitter.emit('iskvs', {error:'cantparseresponse',data:null});
      }
    }
  });
}

function connect(options) {
  client = net.connect(options, function() {
    var chunk = "";
    client.on('data', function(data){
      chunk += data.toString();
      var d_index = chunk.lastIndexOf(delimiter);
      clientParseData(chunk.substring(0, d_index));
      chunk = chunk.substring(d_index + delimiter.length);
    });
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
  emitter.once(id, function(data){
    fireCallback(data, callback);
  });
  var request = {
    id: id,
    command: 'get',
    key: key
  }
  client.write(JSON.stringify(request)+delimiter);
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
  client.write(JSON.stringify(request)+delimiter);
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
  client.write(JSON.stringify(request)+delimiter);
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
  client.write(JSON.stringify(request)+delimiter);
}

var Iskvs = function(options) {
  connect(options);
  this.get = function(key, callback){
    clientGet(key, callback);
  };
  this.set = function(key, value, callback){
    clientSet(key, value, callback);
  };
  this.del = function(key, callback){
    clientDel(key, callback);
  };
  this.clr = function(callback){
    clientClr(callback);
  };
}

module.exports.Client = function(options){
  if(!options) {
    options = {port: 8080};
  }
  return new Iskvs(options)
}