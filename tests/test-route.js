Route = require('../lib/route').Route;

module.exports = {
    
    testGet: function (test) {
        var r = new Route();
        r.get = function(){return "koko"};
        test.equal(r.method,"get");
        test.equal(r.handler(),"koko");
        test.ok(!r.type);
        test.done();
    },
    testPost: function (test) {
        var r = new Route();
        r.post = function(){return "koko"};
        test.equal(r.method,"post");
        test.equal(r.handler(),"koko");
        test.ok(!r.type);
        test.done();
    },
    testGetJSON: function (test) {
        var r = new Route();
        r.get.json = function(){return "koko"};
        test.equal(r.method,"get");
        test.equal(r.handler(),"koko");
        test.equal(r.type,"json");
        test.done();
    },
    testGetTemplate: function (test) {
        var r = new Route();
        r.get.template["/a/b/c.html"] = function(){return "koko"};
        test.equal(r.method,"get");
        test.ok(!r.handler);
        test.equal(r.type,"template");
        var tmplPath = Object.keys(r.tmpl)[0];
        test.equal(tmplPath,"/a/b/c.html");
        test.equal(r.tmpl[tmplPath](),"koko");
        test.done();
    },

};
