import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import './CreateFunding.css';

function CreateFunding() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    goal: '',
    image: null
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }

    try {
      await axios.post('/funding/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('프로젝트가 생성되었습니다!');
      navigate('/funding');
    } catch (error) {
      alert('프로젝트 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="create-funding-container">
      <h2>새 펀딩 프로젝트 만들기</h2>
      <form onSubmit={handleSubmit} className="create-funding-form">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="프로젝트 제목"
          required
        />
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="프로젝트 설명"
          required
        />
        <input
          type="number"
          name="goal"
          value={formData.goal}
          onChange={handleChange}
          placeholder="목표 금액"
          required
        />
        <input
          type="file"
          name="image"
          onChange={handleChange}
          accept="image/*"
        />
        <button type="submit">프로젝트 생성</button>
      </form>
    </div>
  );
}

export default CreateFunding;