"use strict";
var request = require('request'),
	Ys = require('../Ys').Ys,
	d = require('../decorators');

module.exports = {
    setUp: function (callback) {
        Ys("^/$").post.json = d.parseBody(function(req,res){
            res.returnObject(req.POST);
        });
        
        Ys("^/chain/$").post.json = d.chain([
            d.parseBody,
            function(req,res){
                res.returnObject(req.POST);
            }
        ]);
        Ys.run({port:8989,onInit:function(){
            callback();
        }});
    },

    tearDown: function (callback) {
        // clean up
        Ys.stop({onShutdown:function(){
            callback();
        }});
    },
    
    testParseBody: function (test) {
        request.post('http://localhost:8989/', {form:{key:'value'}},
            function (error, res, body) {
                test.equals(res.statusCode,200);
                var json = JSON.parse(body);
                test.equals(json.key,'value');
                test.done();
         });
    },
     
    testChain: function (test) {
        request.post('http://localhost:8989/chain/', {form:{key:'value'}},
            function (error, res, body) {
                test.equals(res.statusCode,200);
                var json = JSON.parse(body);
                test.equals(json.key,'value');
                test.done();
         });
    },
   
};
