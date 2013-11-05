var fs = require('fs'),
    request = require('request');
	Ys = require('../../Ys').Ys;

module.exports = {
    test_init: function (test) {
        //config & run server
        Ys("^/$").get = function(req,res){
            res.end("Hello World!");
        }

        Ys("^/(Good)(Bad)(Ugly)/$").get = function(req,res){
            res.end("The "+req.$1+" the "+req.$2+" and the "+req.$3+".");
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

        Ys("^/hello/(\\w+)/$").get = function(req,res){
            res.end("Hello "+req.$1+"!");
        };

        Ys("^/json_alias/$").rewrite = "/json/";
        
        Ys("^/(Ugly)(Bad)(Good)/$").rewrite = "/$3$2$1/";

        Ys("^/json/$").get.json = function(req,res){
            res.returnObject({"message" : "Hello World"});
        }; 

        Ys("^/json_encoding/$").get.json = function(req,res){
            res.returnObject({"a" : "\xE3"});
        };

        Ys("^/error/$").get.html = function(req,res){
            a.b = 5;
        };

		fs.writeFileSync("/tmp/tmpl.html","<h1>Hello {{name}}!</h1>");
        Ys("^/html_template/$").get.template = {"/tmp/tmpl.html":function(req,res){
			res.returnObject({"name" : "Bob"});
        }};

        fs.writeFileSync("/tmp/tmpl2.html","<h1>Hello {{>name}}!</h1>");
        fs.writeFileSync("/tmp/name.mustache","Koko");
        Ys("^/html_template2/$").get.template = {"/tmp/tmpl2.html":function(req,res){
			res.returnObject({});
        }};

        fs.writeFileSync("/tmp/tmpl3.html","<h1>Hello {{>name2}}!</h1>");
        fs.writeFileSync("/tmp/name2.mustache","{{>title2}} Koko");
        fs.writeFileSync("/tmp/title2.mustache","Mr.");
        Ys("^/html_template3/$").get.template = {"/tmp/tmpl3.html":function(req,res){
			res.returnObject({});
        }};
        
        fs.writeFileSync("/tmp/tmpl4.html","<h1>Hello {{>name3}}!</h1>");
        fs.writeFileSync("/tmp/name3.mustache","{{# show_title }}{{>title}}{{/show_title}} Koko");
        fs.writeFileSync("/tmp/title.mustache","Mr.");
        Ys("^/html_template4/$").get.template = {"/tmp/tmpl4.html":function(req,res){
			res.returnObject({show_title:true});
        }};


		fs.writeFileSync("/tmp/static.txt","Hello World!");
		Ys("^/static.txt$").get.static = "/tmp/";

		Ys("^(.*/[^\./]+)$").redirect = "$1/";//add trailing slash when needed
        
        Ys("^/(Ugly)(Bad)(Good)Again/$").redirect = "/$3$2$1/";

        Ys("^/delete-it/(\\d+)/$").delete = function(req,res){
            res.writeHead(204, {'Content-Type': 'text/plain'});
            res.end();
        };
               
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

    test_get_matches: function (test) {
        request('http://localhost:8780/GoodBadUgly/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"The Good the Bad and the Ugly.");
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

    test_match: function (test) {

        request('http://localhost:8780/hello/Megan/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body,"Hello Megan!");
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
    
    test_json_encoding: function (test) {

        request('http://localhost:8780/json_encoding/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"application/json");
            test.equals(JSON.parse(body)["a"],"\xE3");
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

    test_rewrite_with_matches: function (test) {
        request('http://localhost:8780/UglyBadGood/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"The Good the Bad and the Ugly.");
            test.done();
         })
    },

    test_redirect_with_matches: function (test) {
        request('http://localhost:8780/UglyBadGoodAgain/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(body,"The Good the Bad and the Ugly.");
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

    test_html_template_with_nested_partial_in_a_conditional: function (test) {

        request('http://localhost:8780/html_template4/', function (error, res, body) {
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
    test_404: function (test) {

        request('http://localhost:8780/no-such-page/', function (error, res, body) {
            test.equals(res.statusCode,404);
            test.equals(res.headers['content-type'],"text/html");
            test.done();
         })
         
    },
    test_delete: function (test) {

        request({url:'http://localhost:8780/delete-it/14/',method:"DELETE"}, function (error, res, body) {
            test.equals(res.statusCode,204);
            test.done();
         })
         
    },

    test_error: function (test) {
        request('http://localhost:8780/error/', function (error, res, body) {
            test.equals(res.statusCode,200);
            test.equals(res.headers['content-type'],"text/html");
            test.equals(body.indexOf("<pre><code>"),0);
            test.done();
         });
         
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
