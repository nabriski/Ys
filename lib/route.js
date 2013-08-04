//-------------------------
exports.Route = function(){

    var self = this;
    self.method = null;
    self.type = null;
    self.handler = null;

    ["get","post","delete"].forEach(function(method){
        
        self.__defineGetter__(method,function(){
            self.method = method;
            return this;
        });

        self.__defineSetter__(method,function(handler){
            self.method = method;
            self.handler = handler;
        });

    });

    ["html","json","static","gzip"].forEach(function(type){

        self.__defineSetter__(type,function(handler){
            self.type = type;
            self.handler = handler;
        });

    });


    self.__defineGetter__("template",function(){
        self.type = "template";
        self.tmpl = {};
        return self.tmpl;
    });
};

//-------------------------

