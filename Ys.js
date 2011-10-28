var http = require('http');
var url = require('url');
var fs = require('fs');
var ejs = require('ejs');
//var querystring = require('querystring');

var routes = []
//--------------------------------------------------
var Route = function(){
    
    this.get = new Template();
    this.post = new Template();
    return this;
}
//--------------------------------------------------
var Template = function(){
    return this;
}
//--------------------------------------------------
Template.prototype.html = function(template_path){
    //load template
    var r = this;
    fs.readFile(template_path, function (err, data) {
          if (err) throw err;
          r.compiled = ejs.compile(String(data));
    }); 
    return this;
}
//--------------------------------------------------
var Ys = function(url) {
    
    var idx = routes.indexOf(url);
    if(idx===-1){
        routes.push([url,new Route()]);
        idx = routes.length - 1;
    }

    return routes[idx][1]

}
//--------------------------------------------------
var jsonify = function(object){
    this.end(JSON.stringify(object));
}
//--------------------------------------------------
var htmlify = function(compiled_template){

    return function(object){
        this.end(compiled_template(object));
    }
}
//--------------------------------------------------

Ys.run = function(){
    
    http.createServer(function (req, res) {

        var path = url.parse(req.url).pathname;
        for(var i=0; i < routes.length; i++){
            var regexp = RegExp(routes[i][0]);
            if(!regexp.test(path) || typeof(routes[i][1][req.method.toLowerCase()])==="undefined")
                continue;

            var handler = routes[i][1][req.method.toLowerCase()];
            if(typeof(handler)==="function"){
                handler(req,res);
                return;
            }

            if(typeof(handler)==="object"){
                
                if("json" in handler){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.returnObject = jsonify;
                    handler.json(req,res);
                    return;
                }
                
                if("html" in handler){

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    if("args" in handler){//template
                        res.returnObject = htmlify(handler.compiled);
                        handler.args(req,res);
                    }
                    else
                        res.end(handler.html(req,res));
                }

                return;
            }

        }

    }).listen(8780, "127.0.0.1");
    console.log('Server running at http://127.0.0.1:8780/');
}
//--------------------------------------------------
exports.Ys = Ys;