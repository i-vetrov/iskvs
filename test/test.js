var iskvs = require('../');
var assert = require('assert');

var server = iskvs.Server();
    server.listen(8080);

var client = iskvs.Client({port:8080}, {reconnect:false,timeout:1,attempts:0}, function(){
  client.set('one', 'text for one', function(err, data){
    assert.equal(data, 'success', 'error adding data');
    client.get('one', function(err, data){
      assert.equal(data, 'text for one', 'error reading data');
      client.set('one', 'something else one', function(err, data){
        assert.equal(data, 'success', 'error adding data');
        client.get('one', function(err, data){
          assert.equal(data, 'something else one', 'error reading data');
            client.del('one', function(err, data){
            assert.equal(data, 'success', 'error adding data');
            client.set('one', 'somthing else', function(err, data){
              client.clr(function(){
                assert.equal(data, 'success', 'error clearing data');
                client.get('one', function(err, data){
                  assert.equal(data, null, 'error reading non existing data');
                  console.log('test passed');
                  process.exit(0);
                });
              });
            });
          });          
        });
      });
    });
  });
});