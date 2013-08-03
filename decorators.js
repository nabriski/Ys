var qs = require("querystring");
//----------------------------------------------------------------
exports.parseBody = function(handler){

    return function(req,res){
    
        var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                req.body = body;
                req.POST = qs.parse(body);
                handler(req,res);
            });
    };
    
};
//----------------------------------------------------------------
exports.chain = function(handlers){

    if(!handlers || handlers.length === 0) return;

    var handlersReversed = handlers.slice();
    handlersReversed.reverse();

    var chain = handlersReversed[0];
    if(handlersReversed.length === 1) return chain;

    var theRest = handlersReversed.slice(1);
    theRest.forEach(function(h){
        chain = h(chain);
    });

    return chain;
}; 
//----------------------------------------------------------------
