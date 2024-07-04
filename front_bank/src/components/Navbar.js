import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // 로그인 로직
    console.log('로그인 시도:', loginData);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">금융웹</div>
      <ul className="navbar-links">
        <li><Link to="/account">계좌</Link></li>
        <li><Link to="/funding">펀딩</Link></li>
      </ul>
      <form onSubmit={handleLogin} className="navbar-login">
        <input
          type="text"
          name="username"
          placeholder="아이디"
          value={loginData.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={loginData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className="btn-login">로그인</button>
      </form>
      <Link to="/signup" className="btn-signup">회원가입</Link>
    </nav>
  );
}

export default Navbar;