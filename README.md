iskvs
==============

Simple key-value store for node.js projects.

## Description

iskvs was designed to implement key-value cache storage for InvaNode CMS. It has TCP/UNIX Socket interface and can be deployed as standalone server or a part of node.js application.

## Instalation

      $ npm install iskvs

## Usage

      var iskvs = require('iskvs');
      
      var server = iskvs.Server().listen(8080);
      var client = iskvs.Client({port:8080});

      client.set('index','some index text', function(err, data){
          if(!err) {
              console.log("index value added successfully!");
          }
      });

      client.get('index', function(err, data){
          if(!err) {
              console.log("indes data: " + data);
          }
      });

Full list of client methods: 

      .set(key, value, callback);     // sets new OR updates key/value pair 
      
      .get(key, callback);            // gets value of a specific key
      
      .del(key, callback);            // deletes value of a specific key (key will be deleted too)
      
      .clr(callback);                 // clears all storage

      callback = function (err, data) {...} 

Other creating Client parameters:
      
     var client = iskvs.Client(options, reconnect, onconnect);

`options`: connection options, like `port`, `host` or `path`, required;

`reconnect`: reconnection options `{reconnect: true, timeout:5000, attempts: 10}`, optional;
         
`onconnect`: function, called when connection is established, optional.

For multicore app ussage create server and set up port in master thereat and client in worker:
      
      var cluster = require('cluster');
      var numCPUs = require('os').cpus().length;
      var iskvs = require('iskvs');
      
      if(cluster.isMaster) {
          var server = iskvs.Server();
          server.listen('/tmp/echo.sock');    // can listen UNIX Socket

          ...

          for (var i = 0; i < numCPUs; i++) {
              cluster.fork();
          }
      }
      else if(cluster.isWorker) {
          var cache = iskvs.Client({path:'/tmp/echo.sock'});
          http.createServer(function(req, res) {
              var  = getSomeData(req)
              cache.get(, function(err, data){
                  if(data !== null) {
                      res.writeHeader(200, {'Content-Type':'text/html'});
                      res.end(data);
                  }
                  else {
                     ...       // do something to send not cached data
                  }  
              })
          }).listen(80);  
      }
      
## iskvs server
      
      var iskvs = require('iskvs');
      var server = iskvs.Server().listen(8080);

Server receives JSON formatter commands which should be finished with delimiter `\n`:

      {"id":"UNIQ_ID_HERE", "command":"set", "key":"index", "value":"some index content"}\n

      {"id":"UNIQ_ID_HERE", "command":"get", "key":"index"}\n

      {"id":"UNIQ_ID_HERE", "command":"del", "key":"index"}\n

      {"id":"UNIQ_ID_HERE", "command":"clr"}\n

and responds with JSON string, for example:

      {"id":"SAME_UNIQ_ID_HERE", "data":{"key":"index", "value":"some index content"}, "success":"success"}\n

      {"id":"SAME_UNIQ_ID_HERE", "success":"success"}\n

      {"id":"SAME_UNIQ_ID_HERE", "error":"notstored"}\n

      {"id":"SAME_UNIQ_ID_HERE", "error":"badrequest"}\n

      {"error":"notjsonrequest"}\n

## Licence

The MIT License

Copyright (c) 2013 Ivan Vetrau

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.