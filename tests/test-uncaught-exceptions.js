var fs = require('fs'),
    request = require('superagent');
	Ys = require('../../Ys').Ys;

module.exports = {
    
    //-------------------------------------------------------------
    testCatchUncaught: function (test) {
        
        var ys = Ys.instance();

        ys("^/$").get = function(req,res){
            a.b;//throw exception
            res.end();
        };

      
        ys.run({onInit : function(){
            request.get("http://localhost:8780/").end(function(err,res){
                test.ok(res.text.indexOf("ReferenceError: a is not defined") >= 0);
                ys.stop({onShutdown : function(){
                    test.done();    
                }});
            });
        }});
    },
    //-------------------------------------------------------------
    testCatchUncaughtExplicit: function (test) {
            
        var ys = Ys.instance();

        ys("^/$").get = function(req,res){
            a.b;//throw exception
            res.end();
        };

      
        ys.run({exceptionHandler:null,onInit : function(){
            request.get("http://localhost:8780/").end(function(err,res){
                test.ok(res.text.indexOf("ReferenceError: a is not defined") >= 0);
                ys.stop({onShutdown : function(){
                    test.done();    
                }});
            });
        }});
    },
    
    //-------------------------------------------------------------
    doNotCatchUncaught: function (test) {
            
        var ys = Ys.instance();

        ys("^/$").get = function(req,res){
            a.b;//throw exception
            res.end();
        };

        ys.run({
                exceptionHandler:function(err){
                    var str = err.stack;
                    test.ok(err.stack.indexOf("ReferenceError: a is not defined") >= 0);
                },
                onInit : function(){
                    request.get("http://localhost:8780/").end(function(err,res){
                        ys.stop({onShutdown : function(){
                            test.done();    
                        }});
                    });
                }
        });
    }

};
