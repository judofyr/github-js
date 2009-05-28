describe 'GitHub.Helpers'
  it 'should have empty'
    GitHub.Helpers.empty.should.be_a Function
    GitHub.Helpers.empty.toString().should.be 'function () {}'
  end
  
  it 'should have first'
    var obj = { main: 123 }
    GitHub.Helpers.first(obj).should.be 123
  end
  
  it 'should have extend'
    var base = { one: 1 }
    var other = { two: 2, three: 3 }
    
    GitHub.Helpers.extend(base, other)
    
    base.one.should.be 1
    base.should.include_object other
  end
  
  it 'should have indexOf'
    var arr = ['one', 'two', 'three']
    
    GitHub.Helpers.indexOf(arr, 'one').should.eql 0
    GitHub.Helpers.indexOf(arr, 'two').should.eql 1
    GitHub.Helpers.indexOf(arr, 'three').should.eql 2
    GitHub.Helpers.indexOf(arr, 'four').should.eql -1
  end
  
  it 'should have remove'
    var arr = ['one', 'two', 'three']
  
    GitHub.Helpers.remove(arr, 1)
    arr.should.eql ['one', 'three']
    
    GitHub.Helpers.remove(arr, -1)
    arr.should.eql ['one']
  end
end