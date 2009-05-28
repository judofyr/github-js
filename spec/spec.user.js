describe 'GitHub.User'
  var user;
  
  before_each
    user = new GitHub.User('judofyr')
  end
  
  it 'should start with login'
    user.login.should.eql 'judofyr'
  end

  it 'should load basic'
    var obj = .fixture('user.basic')
    .mockJSONP(obj, 'user/show/judofyr')
    
    user.load(-{
      user.should.include_object obj.user
    })
  end
  
  it 'should load followers'
    var obj = .fixture('user.followers')
    .mockJSONP(obj, 'user/show/judofyr/followers')
    
    user.load('followers', -{
      user.followers.should.eql obj.users
    })
  end

  it 'should load following'
    var obj = .fixture('user.following')
    .mockJSONP(obj, 'user/show/judofyr/following')
    
    user.load('following', -{
      user.following.should.eql obj.users
    })
  end
  
  it 'should load repos'
    var obj = .fixture('user.repos')
    .mockJSONP(obj, 'repos/show/judofyr')
    
    user.load('repos', -{
      user.repos.should.have_length obj.repositories.length
      
      for (var i in user.repos) {
        var repo = user.repos[i]
        var real = obj.repositories[i]
        repo.should.include_object real
      }
    })
  end
  it 'should return a loaded repo when possible'
    var camping = user.repo('camping')
    camping.should.not.load

    var unknown = user.repo('blablabla')
    unknown.should.not.load

    var obj = .fixture('user.repos')
    .mockJSONP(obj)
    
    user.load('repos', -{
      camping = user.repo('camping')
      camping.should.load

      unknown = user.repo('blablabla')
      unknown.should.not.load
    })
  end
end