var http = require('http'),
    assert = require('assert'),
    url = require('url'),
    Ys = require('../Ys').Ys;
//--------------------------------------------
process.on('uncaughtException', function (err) {
    console.log(err);
    process.exit();
});
//--------------------------------------------
var run_tests = function(tests){
    
    var run_test = function(test_idx){
        var test = tests[test_idx];
        process.stdout.write(test.name +"... ");
        var options  = url.parse(test.url);
        options.host = options.hostname;
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.body = "";
            res.on('data', function (chunk) {
                res.body+=chunk;
            });
            
            res.on('end', function () {
                test.func(res);
                console.log("passed.");
                if(tests.length === test_idx +1){
                    console.log("tests finished");
                    process.exit();
                }
                run_test(test_idx+1);
            });

            
        });
        req.end();
    }

    console.log("Running tests:");
    run_test(0);
}
//--------------------------------------------
//config & run server
Ys("^/$").get = function(req,res){
    res.end("Hello World!");
}

Ys("^/raw_html/$").get = function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}

Ys("^/json/$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"});
}
Ys.run();
//--------------------------------------------
run_tests(
    [
        {
            name:"Hello World",url:"http://localhost:8780/",
            func:function(res){
                    assert.equal(res.statusCode,200);
                    assert.equal(res.body,"Hello World!");
            },
        },
        {
            name:"Hello World raw html",url:"http://localhost:8780/raw_html/",
            func:function(res){
                    assert.equal(res.headers['content-type'],'text/html');
                    assert.equal(res.body,"<h1>Hello World!</h1>");
            }
        },
        {
            name:"json",url:"http://localhost:8780/json/",
            func:function(res){
                    assert.equal(res.headers['content-type'],'application/json');
                    assert.equal(JSON.parse(res.body)['message'],"Hello World");
            }
        }

    ]
);
//--------------------------------------------

