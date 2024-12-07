import Mock from 'mockjs'

// 模拟用户信息接口
Mock.mock('/api/user-info', 'get', {
  code: 0,
  data: {
    username: 'testuser',
    password: 'password' // 添加密码字段
  }
})

// 模拟歌单接口
Mock.mock('/api/playlists', 'get', {
  code: 0,
  data: [
    { id: 1, name: '歌单1' },
    { id: 2, name: '歌单2' },
    { id: 3, name: '歌单3' }
  ]
})

// 模拟音乐分类接口
Mock.mock('http://127.0.0.1:4523/m1/5543452-5220389-default/music/category', 'get', {
  code: 0,
  data: ['流行', '摇滚', '民谣']
})

// 模拟音乐接口
Mock.mock('/api/music', 'get', {
  code: 0,
  data: [
    { id: 1, name: '音乐1', category: '流行' },
    { id: 2, name: '音乐2', category: '摇滚' },
    { id: 3, name: '音乐3', category: '民谣' }
  ]
})

// 模拟MV接口
Mock.mock('/api/mv', 'get', {
  code: 0,
  data: [
    { id: 1, name: 'MV1', category: '流行' },
    { id: 2, name: 'MV2', category: '摇滚' },
    { id: 3, name: 'MV3', category: '民谣' }
  ]
})

// 模拟登录
Mock.mock('http://127.0.0.1:4523/m1/5543452-5220389-default/user/login', 'post', (options) => {
  const { username, password } = JSON.parse(options.body)
  if (username === 'testuser' && password === 'password') {
    return {
      code: 0,
      data: {
        id: '1',
        name: 'testuser',
        gender: 'male',
        hobby: 'music'
      }
    }
  } else {
    return {
      code: 1,
      msg: '用户名或密码错误'
    }
  }
})

// 模拟注册
Mock.mock('http://127.0.0.1:4523/m1/5543452-5220389-default/user/register', 'post', {
  code: 0,
  msg: '注册成功'
})
