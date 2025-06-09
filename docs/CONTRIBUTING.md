# Contributing Guidelines

## Language Standards

### Code Standards
- All code must be written in English
- This includes:
  - Variable names
  - Function names
  - Comments
  - Documentation strings
  - Configuration keys
  - File names
  - Branch names
  - Commit messages

### Documentation Standards
- User-facing documentation should be in Chinese (中文)
- Technical documentation should follow these rules:
  - Code examples: English
  - Configuration examples: English
  - Explanations: Chinese (中文)
  - Error messages in logs: English
  - User interface messages: Chinese (中文)

### Communication Standards
- Issue discussions: Chinese (中文)
- Pull request descriptions: Chinese (中文)
- Code review comments: Chinese (中文)
- Technical discussions: Chinese (中文)

## Code Style Guide

### Naming Conventions
```javascript
// Good
const userProfile = {};
function calculateTotalAmount() {}
class DataValidator {}

// Bad
const 用户信息 = {};
function 计算总额() {}
class 数据验证器 {}
```

### Comments
```javascript
// Good
// Calculate user's total score based on activity
function calculateScore() {}

// Bad
// 根据用户活动计算总分
function calculateScore() {}
```

### Documentation
```javascript
// Good
/**
 * Validates user input and returns formatted data
 * @param {string} input - Raw user input
 * @returns {Object} Formatted data object
 */

// Bad
/**
 * 验证用户输入并返回格式化数据
 * @param {string} input - 原始用户输入
 * @returns {Object} 格式化的数据对象
 */
```

## Version Control

### Commit Messages
```
# Good
feat: add user authentication system
fix: resolve timezone display issue

# Bad
feat: 添加用户认证系统
fix: 解决时区显示问题
```

### Branch Names
```
# Good
feature/add-auth
bugfix/timezone-display

# Bad
feature/添加认证
bugfix/时区显示
```

## Error Handling

### Error Messages
```javascript
// Good
throw new Error('Invalid user credentials');
console.error('Database connection failed');

// Bad
throw new Error('用户凭证无效');
console.error('数据库连接失败');
```

### User Messages
```javascript
// Good
const userMessages = {
  loginSuccess: '登录成功！',
  loginFailed: '登录失败，请检查用户名和密码。',
};

// Bad
const userMessages = {
  loginSuccess: 'Login successful!',
  loginFailed: 'Login failed, please check username and password.',
};
```

## Testing

### Test Descriptions
```javascript
// Good
describe('User Authentication', () => {
  it('should validate user credentials', () => {});
});

// Bad
describe('用户认证', () => {
  it('应该验证用户凭证', () => {});
});
```

## Configuration

### Environment Variables
```
# Good
DATABASE_URL=mongodb://localhost:27017
API_KEY=12345

# Bad
数据库地址=mongodb://localhost:27017
接口密钥=12345
```

## Compliance Checklist

- [ ] All code is written in English
- [ ] All comments are in English
- [ ] All technical documentation uses English for code
- [ ] All user-facing content is in Chinese
- [ ] All commit messages are in English
- [ ] All branch names are in English
- [ ] All error logs are in English
- [ ] All user messages are in Chinese 