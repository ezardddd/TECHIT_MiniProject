import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import axios from './axiosConfig';

function Navbar({ isAuthenticated, setAuthState, user }) {
  const [loginData, setLoginData] = useState({ userid: '', userpw: '' });
  const [loginStatus, setLoginStatus] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/login', loginData);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: response.data.user
      });
      setLoginStatus('로그인 성공');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setLoginStatus('로그인 실패');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/users/logout');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setLoginStatus('로그아웃 실패');
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">금융웹</Link>
      <ul className="navbar-links">
        <li><Link to="/funding">펀딩</Link></li>
        {isAuthenticated && (
          <>
            <li><Link to="/view-accounts">계좌 조회</Link></li>
            <li><Link to="/create-account">계좌 생성</Link></li>
            <li><Link to="/setup-2fa" className="btn-setup-2fa">2FA 설정</Link></li>
          </>
        )}
      </ul>
      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="navbar-login">
          <input
            type="text"
            name="userid"
            placeholder="아이디"
            value={loginData.userid}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="userpw"
            placeholder="비밀번호"
            value={loginData.userpw}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn-login">로그인</button>
        </form>
      ) : (
        <div className="navbar-user-info">
          <span>{user?.username}님 환영합니다!</span>
          <button onClick={handleLogout} className="btn-logout">로그아웃</button>
        </div>
      )}
      {loginStatus && <p>{loginStatus}</p>}
      {!isAuthenticated && <Link to="/signup" className="btn-signup">회원가입</Link>}
    </nav>
  );
}

export default Navbar;