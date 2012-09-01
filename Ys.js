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
//===================================================
var Ys = exports.Ys = function(url_regexp) {
	
	var ys_inst = this;
	if(!this._html)
			ys_inst = Ys;
   
	if(typeof(ys_inst.routes)!='object')
			ys_inst.routes = [];

    var matched = ys_inst.routes.filter(function(route){
        return route["regexp"] === url_regexp;
	});


	return matched[0] || (function(){
		var route = {"regexp":url_regexp,"get":{},"post":{}};
		route.get.html =this._html_template(route.get); 
		route.post.html =this._html_template(route.post); 
    	this.routes.push(route);
    	return route;
	}).call(ys_inst);

}
//===================================================
Ys.mime_types = {}
//===================================================
Ys.send_stream = function(fs_path,req,res,headers) {
       
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
            
            var fstream = fs.createReadStream(fs_path,flags);
            fstream.pipe(res);
        
        }); 

};
//===================================================
Ys.send_ogg= function(path,req,res,headers,flags){

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
//===================================================
Ys.send_static = function(base_dir,file_path,req,res){

	var ext = path.extname(file_path).substring(1),
		mime_type = this.mime_types[ext],
		fs_path = path.join(path.resolve(base_dir),file_path),
		headers = {'Accept-Ranges': 'bytes','Content-Type':mime_type};
        

	if(Ys.ogg_header_support && headers["Content-Type"] && headers["Content-Type"].match(/^\w+\/ogg$/)){
			send_ogg(fs_path,req,res,headers);
			return;        
	}
        
	this.send_stream(fs_path,req,res,headers);
}
//===================================================
Ys.send_gzip = function(base_dir,file_path,req,res){

	var ext = path.extname(file_path).substring(1),
	mime_type = this.mime_types[ext],
	fs_path = path.join(path.resolve(base_dir),file_path),
	headers = {'Content-Type':mime_type};

	var raw = fs.createReadStream(fs_path);
	stream_gzip(raw,req,res,headers);
	 
}

//===================================================
Ys._html_template = function(parent){

	return function(template_path){
		parent.html_template = function(object){
		 	//load template
			var res = this;
		 	fs.readFile(template_path, function (err, data) {
				if (err) throw err;
				var compiled = ejs.compile(String(data));
				res.end(compiled(object));
		 	});	
		};

		return parent.html_template;
	};
}
//--------------------------------------------------
exports.client = require('./client');
//--------------------------------------------------
Ys.stream_gzip = function(input,req,res,headers){
       
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
Ys.handlers = [
	
	function redirect(route,req,res){
	
		if(typeof(route.redirect) != "string") return false;
        
     	redirect_to = route["redirect"].replace("$1",req.$1);
		var statusCode = 301;
		
		if(req.method == "post") statusCode = 307;
		res.writeHead(statusCode,{"Location":redirect_to});
		res.end();
        return true;
	},

	function rewrite(route,req,res){
		if(typeof(route.rewrite) != "string") return false;

        req.pathname = route.rewrite.replace("$1",req.$1);
		return false;//so we continue processing the request with the re-written pathname!
	},

	function gzip(route,req,res){
		if(typeof(route[req.method].gzip) != "string") return false;
		var base_dir = route[req.method].gzip; 
		this.send_gzip(base_dir,req.pathname,req,res);
		return true;
	},

	function static(route,req,res){
		if(typeof(route[req.method].static) != "string") return false;
		var base_dir = route[req.method].static; 
		this.send_static(base_dir,req.pathname,req,res);
		return true;
	},

	function raw(route,req,res){
	
		if(typeof(route[req.method]) != "function") return false;

		res.writeHead(200, {'Content-Type': 'text/html'});

		route[req.method](req,res);

		return true;
	
	},

	function json(route,req,res){
		if(typeof(route[req.method].json) != "function") return false;
		
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.returnObject = function(object){
    		this.end(JSON.stringify(object));
		};
		route[req.method].json(req,res);
		return true;
		
	},

	function html(route,req,res){
		if(typeof(route[req.method].json) != "function") return false;
		res.writeHead(200, {'Content-Type': 'text/html'});
		route[req.method].html(req,res);
		return true;
		
	},
	
	function html_template(route,req,res){

		if(typeof(route[req.method].html_template) != "function") return false;

		res.writeHead(200, {'Content-Type': 'text/html'});

		res.returnObject = function(object){

			route[req.method].html_template.call(this,object);
		};
			
		route[req.method].html_template.args(req,res);
		return true;	
	}


];

//--------------------------------------------------
Ys.handle_request = function(req,res){
        
    req.pathname = url.parse(req.url).pathname;
	req.method = req.method.toLowerCase();

	var route = null;
	//find matching route
	this.routes.every(function(r){
        var regexp = RegExp(r.regexp);
		var match = regexp.exec(req.pathname);
        if(match){
			route = r;
			if(match.length > 1) req.$1 = match[1]; 
			return false;
		}
		return true;	
	 });


	if(!route)
		throw new Error(pathname +" >> No mapping for this path");


	var ys_inst = this;
	var request_handled = !ys_inst.handlers.every(function(handler){
		return !handler.call(ys_inst,route,req,res);//reverse return value so every will work correctly
	});

        
    if(!request_handled) 
    	throw new Error(req.pathname +" >> No mapping for this path");
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
                this.mime_types[next[j]] = next[0];
    }

    //correction for some types
    //mime_types["mp3"] = "audio/mp3";
    process.on('uncaughtException', function (err) {
            var str = err.stack;
            console.log(str);
            //res.end(str);
    }); 


	var ys_inst = this;
    var server = Ys.server =http.createServer(function (req, res) {

        try{
            ys_inst.handle_request(req,res); 
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
