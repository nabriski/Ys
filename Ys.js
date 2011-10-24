var http = require('http');
var url = require('url');
//var fs = require('fs');
//var ejs = require('ejs');
var querystring = require('querystring');

var routes = []
//--------------------------------------------------
var Ys = function(url) {
	return new Ys.prototype.init(url);
}
//--------------------------------------------------
Ys.prototype.init = function(url) {
    this.url = url;
    return this;
}
//--------------------------------------------------
Ys.prototype.init.prototype = Ys.prototype; 
//--------------------------------------------------
Ys.prototype.get = function() {
    
    var idx = routes.indexOf(this.url);
    if(idx==-1){
        routes.push([this.url,{}]);
        idx = routes.length - 1;
    }

	if(typeof(routes[idx][1]["GET"])==="undefined")
        routes[idx][1]["GET"] = {};

    return routes[idx][1]["GET"];
}
//--------------------------------------------------
Ys.prototype.post = function() {

    var idx = routes.indexOf(this.url);
    if(idx==-1){
        routes.push([this.url,{}]);
        idx = routes.length - 1;
    }

	if(typeof(routes[idx][1]["POST"])==="undefined")
        routes[idx][1]["POST"] = {};

    return routes[idx][1]["POST"];
}
//--------------------------------------------------
Ys.prototype.run = function(){
    
    http.createServer(function (req, res) {

        var path = url.parse(req.url).pathname;
        for(var i=0; i < routes.length; i++){
            var regexp = routes[i][0];
            if(!regexp.test(path) || typeof(routes[i][1][req.method])==="undefined")
                continue;

            var makers = routes[i][1][req.method];
            if('callback' in makers){
                makers.callback(req,res);
                return;
            }
            
        }

    }).listen(8780, "127.0.0.1");
    console.log('Server running at http://127.0.0.1:8780/');
}
//--------------------------------------------------
exports.Ys = Ys;
