describe 'GitHub.Loader'
  var thing
  
  before_each
    thing = new JS.Singleton({
      id: 0,
      include: GitHub.Loader,
      loaders: {
        basic: function(done) {
          this.id++
          done()
        },
        
        another: function(done) {
          this.id += 2
          done()
        }
      }
    })
  end
  
  it 'should load'
    thing.load('basic')
    thing.id.should.be 1
  end
  
  it 'should default to basic'
    thing.load()
    thing.id.should.be 1
  end
  
  it 'should allow more than one loaders'
    thing.load('basic', 'another')
    thing.id.should.be 3
  end
  
  it 'should allow a callback'
    thing.load(function(obj) {
      obj.should.be thing
      thing.id.should.be 1
    })
    
    thing.load('another', function(obj) {
      obj.should.be thing
      thing.id.should.be 3
    })
  end
  
  it 'should allow a callback with multiple loaders'
    thing.load('basic', 'another', function(obj) {
      obj.should.be thing
      thing.id.should.be 3
    })
  end
  
  it 'should not load twice'
    thing.load('basic')
    thing.id.should.be 1

    thing.load('basic')
    thing.id.should.be 1
  end
  
  it 'should reload'
    thing.load('basic')
    thing.reload('basic')
    thing.id.should.be 2
  end
  
  it 'isLoaded() should work'
    thing.should.not.load
    thing.load()
    thing.should.load
    thing.should.load 'basic'
    thing.load('another')
    thing.should.load 'another'
  end
end