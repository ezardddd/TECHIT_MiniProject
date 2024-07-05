import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import axios from './axiosConfig';

function Navbar() {
  const [loginData, setLoginData] = useState({
    userid: '',
    userpw: ''
  });
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setIsLoggedIn(true);
        try {
          await fetchUserData(token);
        } catch (error) {
          if (error.response && error.response.status === 403) {
            await refreshAccessToken();
          } else {
            handleLogout();
          }
        }
      }
    };

    checkAuthAndFetchUserData();
  }, []);

  const fetchUserData = async (token) => {
    const response = await axios.get('/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setUserData(response.data);
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/users/token', { refreshToken });
      localStorage.setItem('accessToken', response.data.accessToken);
      await fetchUserData(response.data.accessToken);
    } catch (error) {
      console.error('Error refreshing token:', error);
      handleLogout();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/login', loginData);
      setLoginStatus(response.data.msg);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setIsLoggedIn(true);
      await fetchUserData(response.data.accessToken);
      navigate('/');
    } catch (error) {
      setLoginStatus(error.response?.data?.msg || '로그인 실패');
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axios.post('/users/logout', { refreshToken });
    } catch (error) {
      console.error('Error during logout:', error);
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