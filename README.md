# Ys
Node.js micro web framework.

### Installation
```
npm install ys
````

### Hello World:

```javascript

var Ys = require('../Ys').Ys;

Ys("^/$").get = function(req,res){
    res.end("Hello World!");
};

Ys.run({debug:true};);
```
In debug mode the server reloads itself on source changes. Do not use in production.

### API:

#### Server Run Params
```javascript
Ys.run({
    host:"localhost",//default
    port:8780,//default
    user:"nabriski",//no default, will set the process's user to this user after binding to port
    template_engine:"mustache",//default, but if you don't use templating you don't need it installed.
    partials : { // mutstache specific for partials support
                "path":".",//default - path to look for partial files
                "ext":"mustache"//extension of partial files
    },
    debug:false,//default, if set to true server will restart if file including Ys has changed
    onInit:null //default, optional callback to be called when Ys starts listening to requests
});
```

#### Generic Response
```javascript
Ys("^/$").get = function(req,res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<h1>Hello World!</h1>");
};
```

#### JSON Response
```javascript
Ys("^/json$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"};);
};
```

#### Templating
```javascript
// return html response using template 'hello.html' 
// (default template engine is 'mustache.js' but any template engine with a 'compile' method can be defined)
// Where 'hello.html' is:
// <h1>Hello {{name}}!</h1>
Ys("^/hello_bob$").get.template = {'hello.html':function(req,res){
    res.returnObject({"name" : "Bob"};);
}};
```
#### Echo Server
```javascript
Ys("^/hello/(\\w+)/$").get = function(req,res){
    res.end("Hello "+req.$1+"!");
};
```

#### Static Files
```javascript
//return static files
Ys("^/static/.*$").get.static = ".";

//return gzipped file (depends on client's accept encoding)
Ys("^/gzip/.*$").get.gzip = ".";

```

#### Redirect
```javascript
Ys("^(.*/[^\./]+)$").redirect = "$1/";//adds a trailing slash when missing
```

#### Rewrite
```javascript
//rewrite /json_alias/ to /json/
// must appear before the /json/ route
Ys("^/json_alias/$").rewrite = "/json/";

Ys("^/json$").get.json = function(req,res){
    res.returnObject({"message" : "Hello World"};);
};

```

#### Proxy
```javascript
//proxy all requests to http://localhost:8080/
Ys("^/.*$").proxy = "http://localhost:8080/";

```

#### Running Multiple Instances
```javascript
var a= Ys.instance(), b = Ys.instance();

a("^/$").get.html = function(req,res){
    res.end("<h1>Instance A</h1>");
};
a.run({port:8780};);

b("^/$").get.html = function(req,res){
    res.end("<h1>Instance B</h1>");
};
b.run({port:8781};);

```

