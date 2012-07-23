var http = require('http');
var URL = require('url');
//===============================================
exports.getJSON = function(url,callback){

    var options  = URL.parse(url);
    options.host = options.hostname;

    var req = http.request(options, function(res) {
       
        res.setEncoding('utf8');
        res.body = "";
        res.on('data', function (chunk) { res.body+=chunk; });
            
        res.on('end', function () { 
            callback(JSON.parse(res.body)) 
        });
            
    });
    req.end();
};
//===============================================

