var GitHub = {};

// Base uri
GitHub.Base = 'http://github.com/api/v2/json/';

GitHub.Helpers = {
  empty: function(){},
  
  indexOf: function(arr, obj) {
    for (var i in arr) {
      if (arr[i] == obj) {
        return i;
      }
    }
    return -1;
  },
  
  remove: function(array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
  }, 
  
  first: function(object) {
    for (var i in object) {
      return object[i];
    }
  },       
  
  extend: function(target, object) {
    for (var i in object) {
      target[i] = object[i];
    }
  },    
  
  jsonp: function(url, callback, name) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    
    window[name] = function(data) {
      callback(data);
      window[name] = undefined;
      try{ delete window[name]; } catch(e){}
      head.removeChild(script);
    };
    
    head.appendChild(script);
  }
};

// Simple
GitHub.Simple = new JS.Singleton({
  jsonpid: 0,
  call: function(url, query, func) {
    if (!func) {
      func = query;
      query = null;
    }
    
    var name = 'githubjsonp' + this.jsonpid;
    this.jsonpid++;
    
    var query_string = '?callback=' + name;
    if (query) {
      for (var i in query) {
        query_string += '&' + encodeURIComponent(i) + '=' + encodeURIComponent(query[i]);
      }
    }
    
    var full_url = GitHub.Base + url + query_string;
    GitHub.Helpers.jsonp(full_url, func, name);
  },
  
  callset: function(url, object, done) {
    this.call(url, function(data) {
      var first = GitHub.Helpers.first(data);
      
      GitHub.Helpers.extend(object, first); 
      
      if (done) {
        done();
      }
    });
  },
  
  calleach: function(url, iter, done) {
    this.call(url, function(data) {
      var first = GitHub.Helpers.first(data);

      for (var i in first) {
        iter(first[i]);
      }
      
      if (done) {
        done();
      }
    });
  },
  
  callmap: function(url, iter, done) {
    var result = [];
    this.calleach(url, function(thing) {
      result.push(iter(thing));
    }, function() { done(result); });
  }
});

// Loader
GitHub.Loader = new JS.Module({
  initialize: function() {
    this.loaded_set = [];
  },
  
  load: function() {
    var loaders = Array.prototype.slice.call(arguments);
    var callback;
    
    if (loaders[loaders.length - 1] instanceof Function) {
      callback = loaders.pop();
    }
        
    if (loaders.length === 0) {
      loaders.push('basic');
    }
    
    var done;
    if (callback) {
      var finished_loaders = 0,
          all_loaders      = loaders.length,
          self             = this;
          
      done = function() {
        finished_loaders += 1;
        if (finished_loaders == all_loaders) {
          callback(self);
        }
      };  
    } else {
      done = GitHub.Helpers.empty;
    }
    
    for (var i in loaders) {
      this.runLoader(loaders[i], done);
    } 
  },
  
  reload: function() {
    var loaders = Array.prototype.slice.call(arguments);
    
    if (loaders[loaders.length - 1] instanceof Function) {
      loaders.pop();
    }
        
    if (loaders.length === 0) {
      loaders.push('basic');
    }
    
    for (var i in loaders) {
      var index = GitHub.Helpers.indexOf(this.loaded_set, loaders[i]);
      if (index != -1) {
        GitHub.Helpers.remove(this.loaded_set, index);
      }
    }
    
    this.load.apply(this, arguments);
  },
  
  runLoader: function(loader, done) {
    if (this.isLoaded(loader)) {
      done();
    } else {
      var self = this;
      this.loaders[loader].call(this, function() {
        self.loaded(loader);
        done();
      });
    }
  },
  
  isLoaded: function(loader) {
    if (!loader) { loader = 'basic'; }
    return GitHub.Helpers.indexOf(this.loaded_set, loader) != -1;
  },
  
  loaded: function(loader) {
    this.loaded_set.push(loader);
  }
});

GitHub.User = new JS.Class({
  initialize: function(login) {
    this.login = login;
    this.callSuper();
  },
  
  repo: function(name) {
    var res;
    if (this.repos) {
      for (var i in this.repos) {
        var repo = this.repos[i];
        if (repo.name == name) {
          return repo;
        }
      }
    }
    return new GitHub.Repo(this.login, name);
  },
  
  include: GitHub.Loader,
  loaders: {
    basic: function(done) {    
      var url = 'user/show/' + this.login;
      GitHub.Simple.callset(url, this, done);
    },
    
    followers: function(done) {
      this.followers = [];     
      var url = 'user/show/' + this.login + '/followers';
      GitHub.Simple.callset(url, this.followers, done);
    },
    
    following: function(done) {
      this.following = [];     
      var url = 'user/show/' + this.login + '/following';
      GitHub.Simple.callset(url, this.following, done);
    },
    
    repos: function(done) {
      var repos = (this.repos = []);
      var url = 'repos/show/' + this.login;
      GitHub.Simple.calleach(url, function(value) {
        var repo = new GitHub.Repo(value.owner, value.name);
        GitHub.Helpers.extend(repo, value);
        repo.loaded('basic');
        repos.push(repo);
      }, done);
    }
  }
});

GitHub.Repo = new JS.Class({
  initialize: function(owner, name) {
    this.owner = owner;
    this.name  = name;
    this.path  = owner + '/' + name;
    this.callSuper();
  },
  
  issues: function(state, callback) {
    var repo = this;
    var url = 'issues/list/' + this.path + '/' + state;
    
    GitHub.Simple.callmap(url, function(value) {
      var issue = new GitHub.Issue(repo, value.number);
      GitHub.Helpers.extend(issue, value);
      issue.loaded('basic');
      return issue;
    }, callback);
  },
  
  issue: function(number) {
    return new GitHub.Issue(this, number);
  },
  
  commits: function(branch, file, callback) {
    var repo = this;
    var url;

    if (!callback) {
      callback = file;
      url = 'commits/list/' + this.path + '/' + branch;
    } else {
      url = 'commits/list/' + this.path + '/' + branch + '/' + file;
    }
    
    GitHub.Simple.callmap(url, function(value) {
      var commit = new GitHub.Commit(repo, value.id);
      GitHub.Helpers.extend(commit, value);
      commit.loaded('basic');
      return commit;
    }, callback);
  },
  
  commit: function(sha) {
    return new GitHub.Commit(this, sha);
  },
  
  tree: function(sha) {
    return new GitHub.Tree(this, sha);
  },
  
  include: GitHub.Loader,
  loaders: {
    basic: function(done) {
      var url = 'repos/show/' + this.path;
      GitHub.Simple.callset(url, this, done);
    },
    
    tags: function(done) {
      this.tags = {};
      var url = 'repos/show/' + this.path + '/tags';
      GitHub.Simple.callset(url, this.tags, done);
    },
    
    branches: function(done) {
      this.branches = {};
      var url = 'repos/show/' + this.path + '/branches';
      GitHub.Simple.callset(url, this.branches, done);
    }
  }
});

var commit_loader = function(done) {
  var commit = this;
  var url = 'commits/show/' + this.path;
  GitHub.Simple.callset(url, this, function(){
    done();
    
    if (!commit.isLoaded('basic')) {
      commit.loaded('basic');
    }
    
    if (!commit.isLoaded('detailed')) {
      commit.loaded('detailed');
    }
  });
};

GitHub.Commit = new JS.Class({
  initialize: function(repo, sha) {
    this.repo = repo;
    this.sha  = sha;
    this.path = this.repo.path + '/' + this.sha;
    this.callSuper();
  },
                   
  include: GitHub.Loader,
  loaders: {
    basic: commit_loader,
    detailed: commit_loader,
  }
});

GitHub.Tree = new JS.Class({
  initialize: function(repo, sha) {
    this.repo = repo;
    this.sha  = sha;
    this.path = this.repo.path + '/' + this.sha;
    this.callSuper();
  },
  
  include: GitHub.Loader,
  loaders: {
    basic: function(done) {
      var children = (this.children = []);
      var repo = this.repo;
      var parent = this;
      var url = 'tree/show/' + this.path;
      
      GitHub.Simple.calleach(url, function(value) {
        var res;
        if (value.type == 'tree') {
          res = new GitHub.Tree(repo, value.sha);
        } else {
          res = new GitHub.Blob(parent, value.name);
        }
        GitHub.Helpers.extend(res, value);
        children.push(res);
      }, done);
    }
  }
});

GitHub.Blob = new JS.Class({
  initialize: function(parent, name) {
    this.parent = parent;
    this.name   = name;
    this.path   = this.parent.path + '/' + this.name;
    this.callSuper();
  },
  
  include: GitHub.Loader,
  loaders: {
    basic: function(done) {
      var url = 'blob/show/' + this.path;
      GitHub.Simple.callset(url, this, done);
    }
  }
});

GitHub.Issue = new JS.Class({
  initialize: function(repo, number) {
    this.repo   = repo;
    this.number = number;
    this.path   = this.repo.path + '/' + this.number;
    this.callSuper();
  },
  
  include: GitHub.Loader,
  loaders: {
    basic: function(done) {
      var url = 'issues/show/' + this.path;
      GitHub.Simple.callset(url, this, done);
    }
  }
});