# Ys
Node.js micro web framework.

### Hello World:

```javascript

var Ys = require('../Ys').Ys;

Ys("^/$").get = function(req,res){
    res.end("Hello World!");
}

Ys.run();
```

### More Examples:

##### Generic Response
```javascript
Ys("^/$").get = function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
}
```

##### JSON Response
```javascript
Ys("^/json$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"});
}
```

##### HTML Templating
```javascript
// return html response using template 'hello.html' (supports ejs templates for now)
// Where 'hello.html' is:
// <h1>Hello <%= name %>!</h1>
Ys("^/hello_bob$").get.html('hello.html').args = function(req,res){
    res.returnObject({"name" : "Bob"});
}
```

##### Static Files
```javascript
//return static files
Ys("^/static/.*$").get.static(".");

//return gzipped file (depends on client's accept encoding)
Ys("^/gzip/.*$").get.gzip(".");

```
