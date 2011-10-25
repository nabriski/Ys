var http = require('http');
var url = require('url');
//var fs = require('fs');
//var ejs = require('ejs');
//var querystring = require('querystring');

var routes = []
//--------------------------------------------------
var make_route = function(){
    return {"get":{},"post":{}};
}
//--------------------------------------------------
var Ys = function(url) {
    
    var idx = routes.indexOf(url);
    if(idx===-1){
        routes.push([url,make_route()]);
        idx = routes.length - 1;
    }

    return routes[idx][1]

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
                    res.end(JSON.stringify(handler.json(req,res)));
                }
                return;
            }

        }

    }).listen(8780, "127.0.0.1");
    console.log('Server running at http://127.0.0.1:8780/');
}
//--------------------------------------------------
exports.Ys = Ys;
