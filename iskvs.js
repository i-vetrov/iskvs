/**
 * @license iskvs v0.0.1
 * https://github.com/i-vetrov/iskvs
 *
 * Author: Ivan Vetrau (http://www.invatechs.com/)
 *
 * Copyright (C) 2013 Ivan Vetrau 
 * Licensed under the MIT license (MIT)
 **/

// iskvs core app

var server = require('./lib/iskvs-server');
var client = require('./lib/iskvs-client');

module.exports.Server = function(){
  return server;
}

module.exports.Client = function(options){
  return client.Client(options);
}