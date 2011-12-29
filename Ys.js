var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    ejs = require('ejs'),
    path = require('path'),
    exec = require('child_process').exec;
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

    this.send_static = function(file_path,res,headers){
        var fs_path = path.join(path.resolve(base_dir),file_path)
        fs.readFile(fs_path, function (err, data) {
              if (err){
                res.writeHead(404);
                res.end("404 - not found.");
                return;
              };
             if(Ys.ogg_header_support && headers["Content-Type"] && headers["Content-Type"].match(/^\w+\/ogg$/)){
                    
                    var child = exec("ogginfo %s | grep 'Playback length'".replace("%s",fs_path),
                      function (error, stdout, stderr) {
                            
                          if(error)
                                throw error;
                            
                        var lens = stdout.trim().split(":");
                        var MINUTES = 1, SECONDS = 2;
                        var duration = parseFloat(lens[MINUTES])*60 + parseFloat(lens[SECONDS]);
                        headers['X-Content-Duration'] = String(duration);
                        res.writeHead(200,headers);
                        res.end(data);
                    });
                    return;
              }
              res.writeHead(200,headers);
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
        this.end(compiled_template(object));
    }
}
//--------------------------------------------------
var PATH_REGEXP = 0, HANDLERS = 1;
var handle_request = function(req,res){
        
    var pathname = url.parse(req.url).pathname;
    for(var i=0; i < routes.length; i++){
        var regexp = RegExp(routes[i][PATH_REGEXP]);
        var route = routes[i];
        var match = regexp.exec(pathname);
        if(!match)
            continue;
        
        if(typeof(route[HANDLERS]["redirect"]) === "string"){
            pathname = route[HANDLERS]["redirect"].replace("$1",match[1]);
            res.writeHead(301,{"Location":pathname});
            res.end();
            return;
        }

        if(typeof(route[HANDLERS]["rewrite"]) === "string"){
            pathname = route[HANDLERS]["rewrite"].replace("$1",match[1]);
            continue; 
        }

        if(typeof(route[HANDLERS][req.method.toLowerCase()])==="undefined")
            continue;

        var handler = route[HANDLERS][req.method.toLowerCase()];
        if(typeof(handler)==="function"){
            handler(req,res);
            return;
        }


        if(typeof(handler)==="object"){
           
            if("send_static" in handler){
                var ext = path.extname(pathname).substring(1);
                var mime_type = mime_types[ext]
                handler.send_static(pathname,res,{'Content-Type':mime_type});
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

    throw new Error(pathname +" >> No mapping for this path");
}
//--------------------------------------------------
Ys.run = function(port,host){

    if(!port)
        port = 8780;

    if(!host)
        host= "127.0.0.1";

    var mimes_raw  = fs.readFileSync('/etc/mime.types','utf-8').split('\n')
    for(var i=0; i<mimes_raw.length; i++){
        var next = mimes_raw[i].split(/\s+/g)
        if(next && next.length >= 2)
            for(var j=1; j < next.length; j++)    
                mime_types[next[j]] = next[0];
    }

    //correction for some types
    //mime_types["mp3"] = "audio/mp3";

    http.createServer(function (req, res) {

        try{
            handle_request(req,res); 
        }
        catch(e){
            var str = e.stack;
            console.log(str);
            res.end(str);
        }

    }).listen(port,host);
    console.log('Server running at '+host+':'+port+'/');
}
//--------------------------------------------------
