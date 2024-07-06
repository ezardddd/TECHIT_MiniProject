import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import axios from './axiosConfig';  // 경로를 상대 경로로 수정

function Navbar() {
  const [loginData, setLoginData] = useState({ userid: '', userpw: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loginStatus, setLoginStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await axios.get('/users/me');
          setUserData(response.data);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Authentication error:', error);
          handleLogout();
        }
      }
    };

    checkAuth();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/login', loginData);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setIsLoggedIn(true);
      setUserData(response.data.user);
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUserData(null);
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">금융웹</div>
      <ul className="navbar-links">
        <li><Link to="/account">계좌</Link></li>
        <li><Link to="/funding">펀딩</Link></li>
        {isLoggedIn && (
          <>
            <li><Link to="/view-accounts">계좌 조회</Link></li>
            <li><Link to="/create-account">계좌 생성</Link></li>
          </>
        )}
      </ul>
      {!isLoggedIn ? (
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
          <span>{userData?.username}님 환영합니다!</span>
          <button onClick={handleLogout} className="btn-logout">로그아웃</button>
        </div>
      )}
      {loginStatus && <p>{loginStatus}</p>}
      {!isLoggedIn && <Link to="/signup" className="btn-signup">회원가입</Link>}
    </nav>
  );
}

export default Navbar;