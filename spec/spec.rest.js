var repo   = new GitHub.Repo('judofyr', 'camping')
var commit = new GitHub.Commit(repo, 'e7719af8714a4141b2637648892c82198242c167')
var tree   = new GitHub.Tree(repo, '7b914ab1883de2e946238015503b8eacecd5b65b')
var blob   = new GitHub.Blob(tree, 'README')
var issue  = new GitHub.Issue(repo, 1)

describe 'GitHub.Commit'
  it 'should start with repo and sha'
    commit.repo.should.be repo
    commit.sha.should.eql 'e7719af8714a4141b2637648892c82198242c167'
  end                                  
  
  it 'should load'
    var obj = .fixture('commit.basic')
    .mockJSONP(obj, 'commits/show/judofyr/camping/e7719af8714a4141b2637648892c82198242c167')
    
    commit.load(-{
      commit.should.include_object obj.commit
    })
  end
end

describe 'GitHub.Tree'
  it 'should start with repo and sha'
    tree.repo.should.be repo
    tree.sha.should.eql '7b914ab1883de2e946238015503b8eacecd5b65b'
  end                                  

  it 'should load'
    var obj = .fixture('tree.basic')
    .mockJSONP(obj, 'tree/show/judofyr/camping/7b914ab1883de2e946238015503b8eacecd5b65b')
    
    tree.load(-{
      for (var i in tree.children) {
        var child = tree.children[i]
        var real  = obj[i]

        [GitHub.Tree, GitHub.Blob].should.include child.klass

        child.should.include_object real
      }
    })
  end
end

describe 'GitHub.Blob'
  it 'should start with parent and name'
    blob.parent.should.be tree
    blob.name.should.eql 'README'
  end
  
  it 'should load'
    var obj = .fixture('blob.basic')
    .mockJSONP(obj, 'blob/show/judofyr/camping/7b914ab1883de2e946238015503b8eacecd5b65b/README')
  
    blob.load(-{
      blob.should.include_object obj.blob
    })
  end
end

describe 'GitHub.Issue'
  it 'should start with repo and number'
    issue.repo.should.be repo
    issue.number.should.be 1
  end                       
  
  it 'should load'
    var obj = .fixture('issue.basic')
    .mockJSONP(obj, 'issues/show/judofyr/camping/1')
    
    issue.load(-{
      issue.should.include_object obj.issue
    })
  end
end