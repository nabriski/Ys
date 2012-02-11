var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    ejs = require('ejs'),
    path = require('path'),
    exec = require('child_process').exec,
    util = require('util');
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
//===================================================
Handler.prototype.static = function(base_dir){
  
    //----------------------------------------------------
    var send_stream = function(fs_path,req,res,headers) {
       
        
        fs.stat(fs_path,function(err,stats){

            if(err){
                res.writeHead(404);
                res.end("404 - not found.");
                return;

            }
            var ins = util.inspect(stats);
            var size = ins.match(/size:\s*(\d+)/)[1];
            headers['Content-Length'] = size;
            
           var flags = {};
           //console.log(req.headers);
           range = req.headers['range'];
            
           if(range){
                var match = range.match(/^bytes\s*=\s*(\d+)-(\d*)/);
                if(match){
                    var start = parseInt(match[1]);
                    var end = match[2].length > 0 ? parseInt(match[2]) : parseInt(size) -1;
                    headers["Content-Range"] =  'bytes %start-%end/%length'.replace("%start",start).replace("%end",end).replace("%length",size);
                    res.writeHead(206,headers);
                    flags["start"] = start;
                    flags["end"] = end;
                }
                else{
                    res.writeHead(416,headers);
                }
            }
            else
                res.writeHead(200,headers);
            /*fs.readFile(fs_path, function (err, data) {
              if (err) 
                throw err;
              
                res.end(data);
            });*/
            var fstream = fs.createReadStream(fs_path,flags);
            fstream.pipe(res);
        
        }); 

        /*}
            kv = range.split("="); 
            if(!kv[1]) 
        }*/
    }
    //----------------------------------------------------
    var send_ogg= function(path,req,res,headers,flags){

       var child = exec("ogginfo %s | grep 'Playback length'".replace("%s",path),
                  function (error, stdout, stderr) {
                      if(error)
                            throw error;
                        
                    var lens = stdout.trim().split(":");
                    var MINUTES = 1, SECONDS = 2;
                    var duration = parseFloat(lens[MINUTES])*60 + parseFloat(lens[SECONDS]);
                    headers['X-Content-Duration'] = String(duration);
                    send_stream(path,req,res,headers);
            }); 
    }
    //----------------------------------------------------
    
    if(typeof(base_dir)==="undefined")
        base_dir = "";

    this.send_static = function(file_path,req,res){

        var ext = path.extname(file_path).substring(1),
            mime_type = mime_types[ext],
            fs_path = path.join(path.resolve(base_dir),file_path),
            headers = {'Accept-Ranges': 'bytes','Content-Type':mime_type};
        
        

        if(Ys.ogg_header_support && headers["Content-Type"] && headers["Content-Type"].match(/^\w+\/ogg$/)){
            send_ogg(fs_path,req,res,headers);
            return;        
        }
        
        send_stream(fs_path,req,res,headers);
    }
}
//===================================================
var Ys = exports.Ys = function(url) {
   
    var idx = -1;
    for(var i=0; i < routes.length; i++){
        if(routes[i][0]===url){
            idx = i;
        }
    }

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

        if(match.length > 1)
            req.$1 = match[1];

        var handler = route[HANDLERS][req.method.toLowerCase()];
        if(typeof(handler)==="function"){
            handler(req,res);
            return;
        }


        if(typeof(handler)==="object"){
           
            if("send_static" in handler){
                handler.send_static(pathname,req,res);
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
Ys.run = function(port,host,user){

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
    process.on('uncaughtException', function (err) {
            var str = err.stack;
            console.log(str);
            //res.end(str);
    }); 



    var server = http.createServer(function (req, res) {

        try{
            handle_request(req,res); 
        }
        catch(e){
            var str = e.stack;
            console.log(str);
            res.end(str);
        }

    });

    if(user){
        server.once("listening",function(){
            process.setuid(user);        
            //process.setgid(user);        
        });        
    }

    server.listen(port,host);

    console.log('Server running at '+host+':'+port+'/');
}
//--------------------------------------------------
