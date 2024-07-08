import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    pw: '',
    pwConfirm: '',
    name: '',
    email: '',
    securityQuestion: '',
    customSecurityQuestion: '',
    securityAnswer: '',
  });

  const [message, setMessage] = useState('');

  const securityQuestions = [
    "당신의 첫 애완동물의 이름은?",
    "당신이 태어난 도시는?",
    "당신이 졸업한 초등학교의 이름은?",
    "당신의 좋아하는 영화는?",
    "직접 입력"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.pw !== formData.pwConfirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    const finalSecurityQuestion = formData.securityQuestion === "직접 입력" 
      ? formData.customSecurityQuestion 
      : formData.securityQuestion;

    const dataToSend = {
      ...formData,
      securityQuestion: finalSecurityQuestion
    };

    console.log("Sending data:", dataToSend);

    try {
      const response = await axios.post('/users/insertMember', dataToSend);
      console.log("Response:", response.data);
      setMessage(response.data.msg);
      if (response.data.msg === "회원 가입 되셨습니다") {
        console.log("회원가입 성공");
        navigate('/');
      }
    } catch (error) {
      console.error("회원가입 오류", error);
      setMessage("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className="page-container">
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
          <label htmlFor="pwConfirm">비밀번호 확인</label>
          <input
            type="password"
            id="pwConfirm"
            name="pwConfirm"
            value={formData.pwConfirm}
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
        <div className="form-group">
          <label htmlFor="securityQuestion">본인확인 질문</label>
          <select
            id="securityQuestion"
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            required
          >
            <option value="">선택하세요</option>
            {securityQuestions.map((question, index) => (
              <option key={index} value={question}>{question}</option>
            ))}
          </select>
        </div>
        {formData.securityQuestion === "직접 입력" && (
          <div className="form-group">
            <label htmlFor="customSecurityQuestion">직접 입력 질문</label>
            <input
              type="text"
              id="customSecurityQuestion"
              name="customSecurityQuestion"
              value={formData.customSecurityQuestion}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="securityAnswer">본인확인 답변</label>
          <input
            type="text"
            id="securityAnswer"
            name="securityAnswer"
            value={formData.securityAnswer}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="signup-button">회원가입</button>
      </form>
    </div>
    </div>
  );
}

export default SignUp;