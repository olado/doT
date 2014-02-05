var assert = require("assert"), doT = require("../doT");

describe('doT', function(){
    var interpolation = "<div>Hi {{=it.name}}!</div><div>{{=it.age || ''}}</div>",
        interpolationDeps = doT.getDependencies(interpolation),
        // TODO: how to properly grab dependencies from evaluation?
        // evaluation = "{{ for(var prop in it) { }}<div>{{=prop}}</div>{{ } }}",
        // evaluationDeps = doT.getDependencies(evaluation);
        conditionals = "{{? it.name }}<div>Oh, I love your name, {{=it.name}}!</div>{{?? it.age === 0}}<div>Guess nobody named you yet!</div>{{??}}You are {{=it.age}} and still don't have a name?{{?}}",
        conditionalsDeps = doT.getDependencies(conditionals),
        arrays = "{{~it.array :value:index}}<div>{{=value}}!</div>{{~}}",
        arraysDeps = doT.getDependencies(arrays);
        encode = "Visit {{!it.uri}}",
        encodeDeps = doT.getDependencies(encode);

    describe('union', function(){
      it('should remove duplicates and return the union of multiple arrays', function(){
        assert.equal(JSON.stringify(['age', 'name', 'sex']), JSON.stringify(doT.union(['age', 'name'], ['age', 'sex'], ['name'])));
      });
    });

    describe('get variables', function(){
      it('should give back vars', function(){
        assert.equal(JSON.stringify(['age', 'name', 'sex']), JSON.stringify(doT.getVariables('{{? asdf @#(*($@ it.age !@,,, it.age <div>it.name</div> <header>.it.name</header> it.sex', 'it')));
      });
    });

    describe('get interpolation dependencies', function(){
      it('should give back all dependencies', function(){
        assert.equal(JSON.stringify(['name', 'age']), JSON.stringify(interpolationDeps));
      });
    });

    describe('get conditional dependencies', function(){
      it('should give back all dependencies', function(){
        assert.equal(JSON.stringify(['name', 'age']), JSON.stringify(conditionalsDeps));
      });
    });

    describe('get array dependencies', function(){
      it('should give back all dependencies', function(){
        assert.equal(JSON.stringify(['array']), JSON.stringify(arraysDeps));
      });
    });

    describe('test no dependencies', function(){
      it('should return an empty array of dependencies', function(){
        assert.equal(0, doT.getDependencies('<html><head></head><body><div>myTest</div><h1>MyTitle</h1></body></html>').length);
        assert.equal(0, doT.getDependencies('<html><head></head><body><div id="it.test">myTest</div><h1 class="it-test">MyTitle</h1></body></html>').length);
      });
    });

    describe('get encoded dependencies', function(){
      it('should give back all dependencies', function(){
        assert.equal(JSON.stringify(['uri']), JSON.stringify(encodeDeps));
      });
    });
});
