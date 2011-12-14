# Ys
Node.js micro web framework.

#### Hello World:

```javascript

var Ys = require('../Ys').Ys;

Ys("^/$").get = function(req,res){
    res.end("Hello World!");
}

Ys.run();
```

#### Examples:

```javascript
var Ys = require('../Ys').Ys;

//'raw' callback - can write anything
Ys("^/$").get = function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}

//return json response
Ys("^/json$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"});
}

// return html response using template 'hello.html' (supports ejs templates for now)
// Where 'hello.html' is:
// <h1>Hello <%= name %>!</h1>
Ys("^/hello_bob$").get.html('hello.html').args = function(req,res){
    res.returnObject({"name" : "Bob"});
}

//return static files
Ys("^/static/.*$").get.static(".");

Ys.run();
```
