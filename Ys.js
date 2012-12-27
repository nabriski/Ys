var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    fork = require('child_process').fork,
    util = require('util'),
    zlib = require('zlib');
//var querystring = require('querystring');
//===================================================
var Router = function(){
    this.routes = [];
};
//===================================================
Router.prototype.mime_types = {};
//===================================================
Router.prototype.send_stream = function(fs_path,req,res,headers) {
       
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
           var range = req.headers.range;
            
           if(range){
                var match = range.match(/^bytes\s*=\s*(\d+)-(\d*)/);
                if(match){
                    var start = parseInt(match[1],10);
                    var end = match[2].length > 0 ? parseInt(match[2],10) : parseInt(size,10) -1;
                    headers["Content-Range"] =  'bytes %start-%end/%length'.replace("%start",start).replace("%end",end).replace("%length",size);
                    res.writeHead(206,headers);
                    flags.start = start;
                    flags.end = end;
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
Router.prototype.send_ogg= function(path,req,res,headers,flags){

	var child = exec("ogginfo %s | grep 'Playback length'".replace("%s",path),
        function (error, stdout, stderr) {
            if(error) throw error;
				
			var lens = stdout.trim().split(":");
			var MINUTES = 1, SECONDS = 2;
			var duration = parseFloat(lens[MINUTES])*60 + parseFloat(lens[SECONDS]);
			headers['X-Content-Duration'] = String(duration);
			send_stream(path,req,res,headers);
	}); 
};
//===================================================
Router.prototype.send_static = function(base_dir,file_path,req,res){

	var ext = path.extname(file_path).substring(1),
		mime_type = this.mime_types[ext],
		fs_path = path.join(path.resolve(base_dir),file_path),
		headers = {'Accept-Ranges': 'bytes','Content-Type':mime_type};
        

	if(Ys.ogg_header_support && headers["Content-Type"] && headers["Content-Type"].match(/^\w+\/ogg$/)){
			send_ogg(fs_path,req,res,headers);
			return;        
	}
        
	this.send_stream(fs_path,req,res,headers);
};
//===================================================
Router.prototype.send_gzip = function(base_dir,file_path,req,res){

	var ext = path.extname(file_path).substring(1),
	mime_type = this.mime_types[ext],
	fs_path = path.join(path.resolve(base_dir),file_path),
	headers = {'Content-Type':mime_type};

	var raw = fs.createReadStream(fs_path);
	this.stream_gzip(raw,req,res,headers);
	 
};
//--------------------------------------------------
Router.prototype.stream_gzip = function(input,req,res,headers){
       
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
           if(compression_stream) stream = input.pipe(compression_stream);
           else stream = input;

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
};
//--------------------------------------------------
Router.prototype.getPartials = function(tmpl_txt,callback){
    var engine = require(this.tmpl_engine);
    if(typeof(engine.parse) !== "function"){
            callback(null);
            return;
    }

    var tokens = engine.parse(tmpl_txt).filter(function(token){
        return token[0] === ">";
    });

   var partials = {};
   var tokens_processed = "0";

   if(tokens.length===0){
        callback(partials);
        return;
   }

   tokens.forEach(function(token){

        if(partials[token[1]]){
            tokens_processed++;
            return;
        }
        
        var file_path = path.join(path.resolve(this.partials_info.path),token[1]+"."+this.partials_info.ext);
        var router = this;
        fs.readFile(file_path,"utf-8",function (err, data) {
            if (err) throw err;
            
            partials[token[1]] = data;
            router.getPartials(data,function(nested_partials){
                for(var np in nested_partials) if(!partials[np]) partials[np] = nested_partials[np];
                tokens_processed++;
                if(tokens_processed === tokens.length) callback(partials);
            }); 
        });
   },this);
};
//--------------------------------------------------
Router.prototype.handlers = [

    function proxy(route,req,res){
		if(typeof(route.proxy) != "string") return false;

        var req_parsed= url.parse(req.url);
        var proxy_parsed = url.parse(route.proxy);
        req_parsed.protocol = proxy_parsed.protocol;
        req_parsed.hostname = proxy_parsed.hostname;
        req_parsed.port = proxy_parsed.port;

        var proxy_req = http.request(req_parsed, function(backend_res) {
            res.writeHead(backend_res.statusCode,backend_res.headers);
            backend_res.on('data', function (chunk) {
                res.write(chunk);
            });

            backend_res.on('end',function(){
                res.end();
            });
        });

        proxy_req.end();
        return true;
        
    },
	function redirect(route,req,res){
	
		if(typeof(route.redirect) != "string") return false;
        
        var redirect_to = route.redirect;
        var i = 1;
        while(typeof(req["$"+String(i)])==="string"){
            redirect_to = redirect_to.replace("$"+String(i),req["$"+String(i)]);
            i++;
        }

		var statusCode = 301;
		
		if(req.method == "post") statusCode = 307;

		res.writeHead(statusCode,{"Location":redirect_to});
		res.end();
        return true;
	},

	function rewrite(route,req,res){
		if(typeof(route.rewrite) != "string") return false;

        req.pathname = route.rewrite;

        var i = 1;
        while(typeof(req["$"+String(i)])==="string"){
            req.pathname = req.pathname.replace("$"+String(i),req["$"+String(i)]);
            i++;
        }
        this.handle_request(req,res);
		return true;//inverse recusrion above will handle the request.
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
		
        if(typeof(route[req.method].html) != "function") return false;
		res.writeHead(200, {'Content-Type': 'text/html'});
		route[req.method].html(req,res);
		return true;
		
	},
	
	function template(route,req,res){

		if(typeof(route[req.method].template) != "object") return false;

        var tmpl_path = Object.keys(route[req.method].template)[0].replace("$1",req.$1);
        var ext = path.extname(tmpl_path).substring(1),
		mime_type = this.mime_types[ext]
		if(mime_type) res.writeHead(200, {'Content-Type': mime_type});

        var tmpl_func = route[req.method].template[Object.keys(route[req.method].template)[0]] 
        var router = this;
		res.returnObject = function(object){
            //load template
            //var res = this;
            fs.readFile(tmpl_path, "utf-8",function (err, data) {
                if (err) throw err;
                var compiled = require(router.tmpl_engine).compile(data);
                router.getPartials(data,function(partials){
                    res.end(compiled(object,partials));
                });
            });
		};
			
		tmpl_func(req,res);
		return true;	
	}


];

//--------------------------------------------------
Router.prototype.handle_request = function(req,res){
        
    req.pathname = req.pathname || url.parse(req.url).pathname;//in case there is already a pathname like in rewrite recursion
	req.method = req.method.toLowerCase();

	var route = null;
	//find matching route
	this.routes.some(function(r){
        var regexp = RegExp(r.regexp);
		var match = regexp.exec(req.pathname);
        if(match && ("rewrite" in r || "redirect" in r || typeof(r[req.method])==="function" || Object.keys(r[req.method]).length > 0)){
			route = r;
			//if(match.length > 1) req.$1 = match[1]; 
            for(var i=0; i<match.length; i++) req["$"+String(i)] = match[i];
			return true;
		}
		return false;	
	 });

	if(!route)
		throw new Error(req.pathname +" >> No mapping for this path");


	var ys_inst = this;
	var request_handled = ys_inst.handlers.some(function(handler){
		return handler.call(ys_inst,route,req,res);
	});

        
    if(!request_handled) 
    	throw new Error(req.pathname +" >> No mapping for this path");
}
//--------------------------------------------------
var Ys = exports.Ys = function(url_regexp) {
	
	var router = this;
   	if(router === global){
        if(!Ys.router) router = Ys.router = new Router();
        else router = Ys.router;
	}

    var matched = router.routes.filter(function(route){
        return route["regexp"] === url_regexp;
	});

    

	return matched[0] || (function(){
		var route = {"regexp":url_regexp,"get":{},"post":{}};
    	this.routes.push(route);
    	return route;
	}).call(router);

}
//--------------------------------------------------
exports.client = require('./client');
//--------------------------------------------------
Ys.run_debug_parent = function(options){

    var dir = path.dirname(module.parent.filename);
    var module_file = module.parent.filename;
    var prev_stat = fs.statSync(module_file); 
    var child = null;

	var fork_child = function () {
		child = fork(module_file,[],{env:{is_child:true}});
		child.on('exit',fork_child);
	};

    fork_child();
    process.on("SIGTERM",function(){
        child.removeListener('exit', fork_child);
        child.kill();
        process.exit();
    });

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

    var default_options = {
        host:"localhost",
        port:8780,
        template_engine : "mustache",    
        partials : {"path":".","ext":"mustache"},
        on_init : null
    }

	if(!options)
	    options = {};

    Object.keys(default_options).forEach(function(opt){
        if(typeof(options[opt])==="undefined") options[opt] = default_options[opt];
    });

    Object.keys(default_options.partials).forEach(function(opt){
        if(typeof(options.partials[opt])==="undefined") options.partials[opt] = default_options.partials[opt];
    });

    if(options.debug && !process.env.is_child && !Ys.is_in_debug){
        Ys.is_in_debug = true;//so other instances in the same process don't get funny
        Ys.run_debug_parent(options);

        return;
    }

	var router = this;
	if(router === Ys){
		router = Ys.router;
    }

    router.tmpl_engine = options.template_engine;
    router.partials_info = options.partials;

    var mimes_raw  = fs.readFileSync('/etc/mime.types','utf-8').split('\n')
    for(var i=0; i<mimes_raw.length; i++){
        var next = mimes_raw[i].split(/\s+/g)
        if(next && next.length >= 2)
            for(var j=1; j < next.length; j++)    
                router.mime_types[next[j]] = next[0];
    }

    //correction for some types
    //mime_types["mp3"] = "audio/mp3";
    process.on('uncaughtException', function (err) {
            var str = err.stack;
            console.log(str);
            //res.end(str);
    }); 


    var server = router.server = http.createServer(function (req, res) {
        try{
            router.handle_request(req,res); 
        }
        catch(e){
            var str = e.stack;
            console.log(str);
            res.end(str);
        }

    });

    
    server.once("listening",function(){
        if(options.user) process.setuid(options.user);        
        if(options.on_init) options.on_init();
        //process.setgid(user);        
    });        
    

    server.listen(options.port,options.host);

    console.log('Server running at '+options.host+':'+options.port+'/');
}
//--------------------------------------------------
Ys.stop = function(){
    console.log("shutting down ...");

	var router = this;
	if(router === Ys)
		router = Ys.router;
    router.server.close();
}
//--------------------------------------------------
Ys.instance = function(){
	
	var router = new Router(),inst = function(url_regexp){
		return Ys.call(router,url_regexp);
	};
	inst.run = Ys.run.bind(router);
	inst.stop = Ys.stop.bind(router);

	return inst;
}
//--------------------------------------------------

