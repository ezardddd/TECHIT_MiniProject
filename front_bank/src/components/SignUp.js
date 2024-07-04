import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import axios from 'axios'; // axios 설치 필요: npm install axios

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    pw: '',
    name: '',
    email: '',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/insertMember', formData);
      setMessage(response.data.msg);
      if (response.data.msg === "회원 가입 되셨습니다") {
        console.log("회원가입 성공");
        navigate('/');
      }
    } catch (error) {
      setMessage("서버 오류가 발생했습니다.");
      console.error("회원가입 오류", error);
    }
  };

  return (
    <div className="signup-container">
      <h2>회원가입</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-group">
          <label htmlFor="id">아이디</label>
          <input
            type="text"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="pw">비밀번호</label>
          <input
            type="password"
            id="pw"
            name="pw"
            value={formData.pw}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="signup-button">회원가입</button>
      </form>
    </div>
  );
}

export default SignUp;