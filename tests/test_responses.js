var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;

module.exports = {
    test_init: function (test) {
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
		
        Ys("^/html/$").post.html = function(req,res){
            res.end("<h1>Posted!</h1>");
        }

        Ys("^/json_alias/$").rewrite = "/json/";

        Ys("^/json/$").get.json = function(req,res){
            res.returnObject({"message" : "Hello World"});
        } 


		fs.writeFileSync("/tmp/tmpl.html","<h1>Hello {{name}}!</h1>");
        Ys("^/html_template/$").get.html = {"/tmp/tmpl.html":function(req,res){
			res.returnObject({"name" : "Bob"});
        }};

        fs.writeFileSync("/tmp/tmpl2.html","<h1>Hello {{>name}}!</h1>");
        fs.writeFileSync("/tmp/name.mustache","Koko");
        Ys("^/html_template2/$").get.html = {"/tmp/tmpl2.html":function(req,res){
			res.returnObject({});
        }};

        fs.writeFileSync("/tmp/tmpl3.html","<h1>Hello {{>name2}}!</h1>");
        fs.writeFileSync("/tmp/name2.mustache","{{>title}} Koko");
        fs.writeFileSync("/tmp/title.mustache","Mr.");
        Ys("^/html_template3/$").get.html = {"/tmp/tmpl3.html":function(req,res){
			res.returnObject({});
        }};
		fs.writeFileSync("/tmp/static.txt","Hello World!");
		Ys("^/static.txt$").get.static = "/tmp/";

		Ys("^(.*/[^\./]+)$").redirect = "$1/";//add trailing slash when needed
               
        Ys.run({partials:{
            path:"/tmp"
        }});
        test.done();
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

        request('http://localhost:8780/html/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello World!</h1>");
            test.done();
         })
         
    },

    test_post_html: function (test) {

        request.post('http://localhost:8780/html/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Posted!</h1>");
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
	test_redirect: function (test) {

        request('http://localhost:8780/json', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"application/json");
            test.equals(JSON.parse(body)["message"],"Hello World");
            test.done();
         })
         
    },

	test_rewrite: function (test) {

        request('http://localhost:8780/json_alias/', function (error, res, body) {
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
         
    },

    test_html_template_with_partial: function (test) {

        request('http://localhost:8780/html_template2/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello Koko!</h1>");
            test.done();
         })
         
    },

    test_html_template_with_nested_partial: function (test) {

        request('http://localhost:8780/html_template3/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"<h1>Hello Mr. Koko!</h1>");
            test.done();
         })
         
    },
	test_static: function (test) {

        request('http://localhost:8780/static.txt', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/plain");
            test.equals(body,"Hello World!");
            test.done();
         })
         
    },
	test_cleanup: function (test) {
        // clean up
        Ys.stop();
		fs.unlinkSync("/tmp/tmpl.html");
		fs.unlinkSync("/tmp/tmpl2.html");
		fs.unlinkSync("/tmp/tmpl3.html");
		fs.unlinkSync("/tmp/name.mustache");
		fs.unlinkSync("/tmp/name2.mustache");
		fs.unlinkSync("/tmp/title.mustache");
		fs.unlinkSync("/tmp/static.txt");
        test.done();
    },
    
};
