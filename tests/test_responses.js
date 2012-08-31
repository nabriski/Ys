var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;

module.exports = {
    setUp: function (callback) {
        //config & run server
        Ys("^/$").get = function(req,res){
            res.end("Hello World!");
        }
        
        Ys("^/raw_html/$").get = function(req,res){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end("<h1>Hello World!</h1>");
        }
		
		Ys("^/html/$").get.html = function(req,res){
            res.end("<h1>Hello World!</h1>");
        }

        Ys("^/json/$").get.json = function(req,res){
            res.returnObject({"message" : "Hello World"});
        } 


		fs.writeFileSync("/tmp/tmpl.html","<h1>Hello <%= name %>!</h1>");
        Ys("^/html_template/$").get.html("/tmp/tmpl.html").args=function(req,res){
			res.returnObject({"name" : "Bob"});
        }

                
        Ys.run();
        callback();
    },
    tearDown: function (callback) {
        // clean up
        Ys.stop();
        callback();
    },
    test_get: function (test) {

        request('http://localhost:8780/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"Hello World!");
            test.done();
         })
         
    },

    test_raw_html: function (test) {

        request('http://localhost:8780/raw_html/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello World!</h1>");
            test.done();
         })
         
    },
	
	test_html: function (test) {

        request('http://localhost:8780/raw_html/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello World!</h1>");
            test.done();
         })
         
    },


    test_json: function (test) {

        request('http://localhost:8780/json/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"application/json");
            test.equals(JSON.parse(body)["message"],"Hello World");
            test.done();
         })
         
    },

	test_html_template: function (test) {

        request('http://localhost:8780/html_template/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello Bob!</h1>");
            test.done();
         })
         
    }

    /*
     
    Ys("^/raw_html/$").get = function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}

Ys("^/json/$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"});
} 
     */
};
