var http = require('http');
var url = require('url');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

//var querystring = require('querystring');

var mime_types = {}
var routes = []
//--------------------------------------------------
var Route = function(){
    
    this.get = new Handler();
    this.post = new Handler();
    return this;
}
//--------------------------------------------------
var Handler = function(){
    return this;
}
//--------------------------------------------------
Handler.prototype.html = function(template_path){
    //load template
    var t = this;
    fs.readFile(template_path, function (err, data) {
          if (err) throw err;
          t.compiled = ejs.compile(String(data));
    }); 
    return this;
}
//--------------------------------------------------
Handler.prototype.static = function(base_dir){
   
    if(typeof(base_dir)==="undefined")
        base_dir = "";

    this.send_static = function(file_path,res){
        fs.readFile(path.join(path.resolve(base_dir),file_path), function (err, data) {
              if (err) throw err;
              res.end(data);
        });
    }
}
//--------------------------------------------------
var Ys = exports.Ys = function(url) {
    
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
        if(typeof(object)==="undefined"){//no args object, just send the html
            this.end(compiled_template(object));
            return;
        }
        return compiled_template(object);
    }
}
//--------------------------------------------------

Ys.run = function(){

    var mimes_raw  = fs.readFileSync('/etc/mime.types','utf-8').split('\n')
    for(var i=0; i<mimes_raw.length; i++){
        var next = mimes_raw[i].split(/\s+/g)
        if(next && next.length === 2)    
            mime_types[next[1]] = next[0];
    }

    http.createServer(function (req, res) {

        var pathname = url.parse(req.url).pathname;
        for(var i=0; i < routes.length; i++){
            var regexp = RegExp(routes[i][0]);
            if(!regexp.test(pathname) || typeof(routes[i][1][req.method.toLowerCase()])==="undefined")
                continue;

            var handler = routes[i][1][req.method.toLowerCase()];
            if(typeof(handler)==="function"){
                handler(req,res);
                return;
            }

            if(typeof(handler)==="object"){
               
                if("send_static" in handler){
                    var ext = path.extname(pathname).substring(1);
                    var mime_type = mime_types[ext] 
                    res.writeHead(200, {'Content-Type':mime_type});
                    handler.send_static(pathname,res);
                    return; 
                }

                if("json" in handler){
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.returnObject = jsonify;
                    handler.json(req,res);
                    return;
                }
                
                if("html" in handler){

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    if("args" in handler){//actual template
                        res.returnObject = htmlify(handler.compiled);
                        handler.args(req,res);
                    }
                    else
                        res.end(htmlify(handler.compiled)());
                }

                return;
            }

        }

    }).listen(8780, "127.0.0.1");
    console.log('Server running at http://127.0.0.1:8780/');
}
//--------------------------------------------------
