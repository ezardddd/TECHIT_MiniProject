import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import axios from './axiosConfig';  // axiosConfig에서 설정한 인스턴스 사용

function Navbar() {
  const [loginData, setLoginData] = useState({ userid: '', userpw: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loginStatus, setLoginStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await axios.get('/users/me');
        setUserData(response.data);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Authentication error:', error);
        // 에러 처리는 axiosConfig의 인터셉터에서 처리됩니다.
      }
    }
  };

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
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!accessToken || !refreshToken) {
        throw new Error('토큰이 없습니다.');
      }
  
      await axios.post('/api/users/logout', {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Refresh': refreshToken
        }
      });
  
      // 로그아웃 성공 처리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUserData(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setLoginStatus('로그아웃 실패');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">금융웹</div>
      <ul className="navbar-links">
        <li><Link to="/funding">펀딩</Link></li>
        {isLoggedIn && (
          <>
            <li><Link to="/view-accounts">계좌 조회</Link></li>
            <li><Link to="/create-account">계좌 생성</Link></li>
            <li><Link to="/setup-2fa" className="btn-setup-2fa">2FA 설정</Link></li>
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