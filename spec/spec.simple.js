describe 'GitHub.Simple'
  it 'should have call'
    .mockJSONP(123, 'hello')
    
    GitHub.Simple.call('hello', function(data) {
      123.should.be 123
    })
  end
  
  it 'should have callset'
    .mockJSONP({main: {one: 1, two: 2, three: 3}}, 'hello')
    var obj = {}
    
    GitHub.Simple.callset('hello', obj, function() {
      obj.one.should.be 1
      obj.two.should.be 2
      obj.three.should.be 3
    })
  end
  
  it 'should have calleach'
    .mockJSONP({main:['one', 'two', 'three']}, 'hello')
    var expected = ['one', 'two', 'three']
    
    GitHub.Simple.calleach('hello', function(value) {
      value.should.be expected.shift()
    })
  end

  it 'should have callmap'
    .mockJSONP({main:['one', 'two', 'three']}, 'hello')
    var expected = ['one', 'two', 'three']
    var id = 0
    var done = function(array) {
      array.should.eql [1, 2, 3]
    }
    var iter = function(value) {
      value.should.be expected.shift()
      id++
      return id
    }
    
    GitHub.Simple.callmap('hello', iter, done)
  end
end