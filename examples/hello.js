var Ys = require('../Ys').Ys;

//'raw' callback - can write anything
Ys("^/$").get = function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}

//return json response
Ys("^/json$").get.json = function(req,res){
    res.writeObject({"message" : "Hello World"});
}

//return html response
Ys("^/html$").get.html = function(req,res){
    return "<h1>Hello World!</h1>";
}

//return html response using template 'hello.html' (supports ejs templates for now)
Ys("^/hello_bob$").get.html('hello.html').args = function(req,res){
    return {"name" : "Bob"};
}

Ys.run();
