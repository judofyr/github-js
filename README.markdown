GitHub.js
=========

GitHub.js is a simple library for interacting with GitHub's v2 API.

Quickstart
----------
    
    /*
     * LOADERS
     */

    var user = new GitHub.User('judofyr');
    
    // Let's load some data:
    user.load('basic')
    
    // That command is async, so let's add a callback too:
    // (since basic already has been loaded,
    //  this would not make any calls to GitHub)
    user.load('basic', function(obj) {
      user == obj;    // The object itself is passed to the callback,
                      // so you can easily pass in a normal function.
      
      user.name;      // Now our object has many properties (see API below)
    });
    
    // You can give it multiple loaders too:
    user.load('basic', 'followers');
    user.load('basic', 'following', callback);
    
    // The loader defaults to 'basic':
    user.load()         // equals to user.load('basic')
    user.load(callback) // equals to user.load('basic', callback)
    
    // More stuff
    user.isLoaded('basic') == true
    user.reload('basic')    // Load basic again
    
    /*
     * FETCHERS
     */
     
    var repo = user.repo('something');
    
    // Let's load the issues:
    repo.issues('open', function(issues) {
      repo != issues;   // Now issues is a completely different object.
    });
    
    // If we fetch them again, it will cause a new call to GitHub:
    repo.issues('open', callback);
    
Use
---

Run `rake build` and you'll get two versions:

* github.only.js, which depends on JS.Class being loaded already
* github.js, which already includes JS.Class

Read the quickstart at the top, the API at the bottom and take a look at examples/
    
Use the fork, Luke
------------------

I've used the excellent [JS.Class](http://jsclass.jcoglan.com/) which fakes Ruby's object model in JavaScript. It allowed me to quickly build this and get something working pretty well. The goal is however to *not* have any other dependencies and make it so idomatic JavaScript as possible.

I would be very grateful if someone could take a look at the code and point out all my silly mistakes. This applies to everything, both the frontend API which you'll be using and the backend code which handles API calls. Fork away, don't be afraid of refactoring and deleting my code, and I'll merge your changes right away!

Magnus Holm <judofyr@gmail.com>

---

API
---

### GitHub.User

    var user = new GitHub.User(login);
    
    user.load(function() {
      user.company;
      user.name;
      user.following_count;
      user.blog;
      user.public_repo_count;
      user.public_gist_count;
      user.id;
      user.login;
      user.followers_count;
      user.created_at;
      user.email;
      user.location;
    });
    
    user.load('followers', 'following', function() {
      user.followers;
      user.following;
    });
    
    user.load('repos', function() {
      user.repos;   // => [GitHub.Repo]
    });
    
    user.repo(project) // => GitHub.Repo
                       // Preloaded if you've already loaded repos
                       
### GitHub.Repo

    var repo = new GitHub.Repo(owner, name);
    
    repo.load(function() {
      repo.name;
      repo.watchers;
      repo.private;
      repo.url;
      repo.fork;
      repo.forks;
      repo.description;
      repo.homepage;
      repo.owner;
    });
    
    repo.load('tags', 'branches', function() {
      repo.tags;        // { name: sha }
      repo.branches     // { name: sha }
    });
    
    repo.tree(sha)      // GitHub.Tree
    
    repo.issues('open' OR 'closed', function(issues) {
      issues;           // [GitHub.Issue]
    });
    
    repo.issue(number)  // GitHub.Issue
    
    repo.commits(branch, function(commits) {
      commits;          // [GitHub.Commit]
    });
    
    repo.commits(branch, filename, function(commits) {
      commits;          // [GitHub.Commit]
    });
    
    repo.commit(number) // GitHub.Commit
    
### GitHub.Issue

    var issue = new GitHub.Issue(repo, number); // Please use repo.issue(number)
    
    issue.load(function() {
      issue.user;
      issue.updated_at;
      issue.votes;
      issue.number;
      issue.title;
      issue.body;
      issue.position;
      issue.state;
      issue.created_at;
    });
    
### GitHub.Commit

    var commit = new GitHub.Commit(repo, sha); // Please use repo.commit(sha)
    
    commit.load(function() {
      commit.message;
      commit.parents;
      commit.author;
      commit.url;
      commit.id;
      commit.committed_date;
      commit.authored_date;
      commit.tree;
      commit.committer;
    });

    commit.load('detailed', function() {
      commit.added;
      commit.removed;
      commit.modified;
    });
    
### GitHub.Tree

    var tree = new GitHub.Tree(repo, sha); // Please use repo.tree(sha)
    
    tree.load(function() {
      tree.children;  // [GitHub.Tree OR GitHub.Blob]
      
      var child = tree.children[0];
      
      child.name;
      child.sha;
      child.mode;
      child.type;
    });
    
### GitHub.Blob

    var blob = new GitHub.Blob(tree, filename);
    
    blob.load(function() {
      blob.name;
      blob.sha;
      blob.size;
      blob.mode;
      blob.mime_type;
      blob.data;
    })