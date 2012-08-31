var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    ejs = require('ejs'),
    path = require('path'),
    exec = require('child_process').exec,
    fork = require('child_process').fork,
    util = require('util'),
    zlib = require('zlib');
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
Handler.prototype.gzip = function(base_dir){

    if(typeof(base_dir)==="undefined")
        base_dir = "";

    this.send_gzip = function(file_path,req,res){

        var ext = path.extname(file_path).substring(1),
            mime_type = mime_types[ext],
            fs_path = path.join(path.resolve(base_dir),file_path),
            headers = {'Content-Type':mime_type};
       

        var raw = fs.createReadStream(fs_path);
        stream_gzip(raw,req,res,headers);
        /*
        var acceptEncoding = req.headers['accept-encoding'];
        if (!acceptEncoding) 
            acceptEncoding = '';

        var stream = raw;
        
        // Note: this is not a conformant accept-encoding parser.
        // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
        if (acceptEncoding.match(/\bdeflate\b/)) {
            headers['content-encoding'] = 'deflate';
            stream = raw.pipe(zlib.createDeflate());
        } else if (acceptEncoding.match(/\bgzip\b/)) {
            headers['content-encoding'] = 'gzip';
            stream = raw.pipe(zlib.createGzip());
        }
            
       res.writeHead(200,headers);
       stream.pipe(res); 
       */     
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
exports.client = require('./client');
//--------------------------------------------------
var jsonify = function(object){
    this.end(JSON.stringify(object));
}
//--------------------------------------------------
var htmlify = function(compiled_template,req,headers){

    return function(object){
        //this.end(compiled_template(object));
        var html = compiled_template(object);
	    stream_gzip(html,req,this,headers);
    }
}
//--------------------------------------------------
var stream_gzip = Ys.stream_gzip = function(input,req,res,headers){
       
        var acceptEncoding = req.headers['accept-encoding'];
        if (!acceptEncoding) 
            acceptEncoding = '';

        var stream = null,compression_stream = null;
        
        // Note: this is not a conformant accept-encoding parser.
        // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
        if (acceptEncoding.match(/\bdeflate\b/) && req.headers['user-agent'].indexOf("MSIE") < 0) { //IE does not seem to support deflate very well
            headers['content-encoding'] = 'deflate';
            compression_stream = zlib.createDeflate();
        } else if (acceptEncoding.match(/\bgzip\b/)) {
            headers['content-encoding'] = 'gzip';
            compression_stream = zlib.createGzip(); 
        }
        
       res.writeHead(200,headers);

       if(typeof(input.pipe) === "function"){
			   if(compression_stream)
					stream = input.pipe(compression_stream);
			   else
					stream = input;

			   stream.pipe(res);
			   return;
       }
      
       if(compression_stream){
	    compression_stream.pipe(res);
	    compression_stream.write(input);
	    compression_stream.end();
	    return;
       }

       res.end(input);

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
            if(req.method.toLowerCase() == "post")
                res.writeHead(307,{"Location":pathname});
            else
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

        function isEmpty(obj) {
            for(var prop in obj)
                if(obj.hasOwnProperty(prop))
                    return false;
            return true;
        }

        if(typeof(handler)==="object" && isEmpty(handler))
            throw new Error(pathname +" >> No handler defined for selector '"+regexp+"' and method "+req.method);

        if(typeof(handler)==="function"){
            handler(req,res);
            return;
        }


        if(typeof(handler)==="object"){
           
            if("send_gzip" in handler){
                handler.send_gzip(pathname,req,res);
                return; 
            }
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
                var headers ={'Content-Type': 'text/html'};
                res.returnObject = htmlify(handler.compiled,req,headers);

                if("args" in handler)//actual template
                    handler.args(req,res);
                else
                    res.returnObject();

            }

            return;
        }

    }

    throw new Error(pathname +" >> No mapping for this path");
}
//--------------------------------------------------
var run_debug_parent = function(options){

    var dir = path.dirname(module.parent.filename);
    var module_file = module.parent.filename;
    var prev_stat = fs.statSync(module_file); 
    var child = null;

	var fork_child = function () {
		child = fork(module_file,[],{env:{is_child:true}});
		child.on('exit',fork_child);
	};

    fork_child();

    var tid = null;
    fs.watch(dir, function(event,filename){
        clearTimeout(tid);
        tid = setTimeout(function(){
            stat = fs.statSync(module_file);
            if(stat.mtime.getTime() > prev_stat.mtime.getTime()){
                console.log("restarting server...");
                prev_stat = stat;
                child.kill();
            }
        }, 1000);
    });
 };
//--------------------------------------------------
Ys.run = function(options){

	if(!options)
	    options = {};

    if(options.debug && !process.env.is_child){
        run_debug_parent(options);
        return;
    }

    if(!options.port)
        options.port = 8780;

    if(!options.host)
        options.host= "localhost";

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


    var server = Ys.server =http.createServer(function (req, res) {

        try{
            handle_request(req,res); 
        }
        catch(e){
            var str = e.stack;
            console.log(str);
            res.end(str);
        }

    });

    if(options.user){
        server.once("listening",function(){
            process.setuid(options.user);        
            //process.setgid(user);        
        });        
    }

    server.listen(options.port,options.host);

    console.log('Server running at '+options.host+':'+options.port+'/');
}
//--------------------------------------------------
Ys.stop = function(){
    console.log("shutting down ...");
    Ys.server.close();
}
//--------------------------------------------------
