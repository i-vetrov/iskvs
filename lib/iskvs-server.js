/**
 * @license iskvs v0.0.2
 * https://github.com/i-vetrov/iskvs
 *
 * Author: Ivan Vetrau (http://www.invatechs.com/)
 *
 * Copyright (C) 2013 Ivan Vetrau 
 * Licensed under the MIT license (MIT)
 **/

// iskvs server app

var net = require('net');
var crypto = require('crypto');
var _delimiter = '\n';
var store = {};

function serverGetResponse(data, connection) {
  var response = {id: data.id};
  if(data.key) {
    if(store[data.key]) {
      response.data = {
        key: data.key,
        value: store[data.key]
      }
      response.success = 'success';
    }
    else {
      response.error = 'notstored';
    }
  }
  else {
    response.error = 'badrequest';
  }
  connection.write(JSON.stringify(response) + _delimiter);
}

function serverSetResponse(data, connection) {
  var response = {id: data.id};
  if(data.key && data.value) {
    store[data.key] = data.value;
    response.success = 'success';
  }
  else {
    response.error = 'badrequest';
  }
  connection.write(JSON.stringify(response) + _delimiter);
}

function serverDelResponse(data, connection) {
  var response = {id: data.id};
  if(data.key) {
    store[data.key] = undefined;
    delete store[data.key];
    response.success = 'success';
  }
  else {
    response.error = 'badrequest';
  }
  connection.write(JSON.stringify(response) + _delimiter);
}

function serverClrResponse(data, connection) {
  var response = {id: data.id};
  for (s in store) {
    if(store.hasOwnProperty(s)){
      store[s] = undefined;
      delete store[s];
    }
  }
  response.success = 'success';
  connection.write(JSON.stringify(response) + _delimiter);
}

function serverRouteData(data, connection) {
  try {
    data = JSON.parse(data);
    if(data.command && data.id) {
      switch(data.command) {
        case 'get':
          serverGetResponse(data, connection);
          break;
        case 'set':
          serverSetResponse(data, connection);
          break;
        case 'del':
          serverDelResponse(data, connection);
          break;
        case 'clr':
          serverClrResponse(data, connection);
          break;
        default:
          break;
      }
    } else if(data.id) {
      var response = {id: data.id};
      response.error = 'badrequest';
      connection.write(JSON.stringify(response) + _delimiter);
    }
  }
  catch(e) {
    connection.write(JSON.stringify({error: 'notjsonrequest'}) + _delimiter);
  }
}

function serverParseData(data, connection) {
  data.toString().split(_delimiter).forEach(function(d){
    if(d !== '') {
      serverRouteData(d, connection);
    }
  });
}

module.exports = net.createServer(function(connection) {
  var chunk = "";
  connection.on('data', function(data){
    chunk += data.toString();
    var d_index = chunk.lastIndexOf(_delimiter);
    serverParseData(chunk.substring(0, d_index), connection);     
    chunk = chunk.substring(d_index + _delimiter.length);
  });
}).on('error', function(err){
    console.log("iskvs error occured: "+ err.code);
});