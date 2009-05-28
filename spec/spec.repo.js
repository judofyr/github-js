describe 'GitHub.Repo'
  var repo
  
  before_each
    repo = new GitHub.Repo('judofyr', 'camping')
  end
  
  it 'should start with owner and name'
    repo.owner.should.eql 'judofyr'
    repo.name.should.eql 'camping'
  end
  
  it 'should load basic'
    var obj = .fixture('repo.basic')
    .mockJSONP(obj, 'repos/show/judofyr/camping')
  
    repo.load(-{
      repo.should.include_object obj.repositories
    })
  end
  
  it 'should load branches'
    var obj = .fixture('repo.branches')
    .mockJSONP(obj, 'repos/show/judofyr/camping/branches')
    
    repo.load('branches', -{
      repo.branches.should.eql obj.branches
    })
  end
  
  it 'should load tags'
    var obj = .fixture('repo.tags')
    .mockJSONP(obj, 'repos/show/judofyr/camping/tags')
    
    repo.load('tags', -{
      repo.tags.should.eql obj.tags
    })
  end
  
  it 'should have commits'
  end
  
  it 'should have shortcuts to a commit'
    var commit = repo.commit('e7719af8714a4141b2637648892c82198242c167')
    commit.should.be_a GitHub.Commit
    commit.repo.should.be repo
    commit.sha.should.be 'e7719af8714a4141b2637648892c82198242c167'
  end
  
  it 'should have issues'
  end

  it 'should have shortcuts to a issue'
    var issue = repo.issue(1)
    issue.should.be_a GitHub.Issue
    issue.repo.should.be repo
    issue.number.should.be 1
  end
end