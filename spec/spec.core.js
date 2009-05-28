GitHub.Helpers.jsonp = function(url) {
  alert('Attempting to call API: ' + url)
}

JSpec.addMatchers({
  include_object : function(actual, expected) {
    var eql = JSpec.matchers['eql'].match
    for (var i in expected) {
      var e = expected[i]
      var a = actual[i]
      if (!eql(a, e)) {
        return false
      }
    }
    return true    
  },
  load : function(actual, expected) {
    return actual.isLoaded(expected)
  }
})

JSpec.context = {
  mockJSONP: function(res, test_path) {
    var old = GitHub.Helpers.jsonp
    GitHub.Helpers.jsonp = function(url, callback) {
      if (test_path) {
        var path = url.substring(30, url.indexOf('?'))
        JSpec.match(path, 'should', 'be', [test_path])
      }
      if (callback) {
        callback(res)
      }
      GitHub.Helpers.jsonp = old
    }                
  },
  fixtures: {},
  fixture: function(name) {
    if (this.fixtures[name])
      return this.fixtures[name]
     
    var path = 'fixtures/' + name + '.js'
    var content = eval('(' + JSpec.load(path) + ')')
    this.fixtures[name] = content
    return content
  }
}