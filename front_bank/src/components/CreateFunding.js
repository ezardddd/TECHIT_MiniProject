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
  const [fileError, setFileError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file) {
      if (file.size > maxSize) {
        setFileError('파일 크기는 5MB를 초과할 수 없습니다.');
        e.target.value = '';
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setFileError('허용되지 않는 파일 형식입니다. JPEG, PNG, GIF, WEBP만 가능합니다.');
        e.target.value = '';
        return;
      }

      setFileError('');
      setFormData(prev => ({ ...prev, image: file }));
    }
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
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp"
        />
        {fileError && <p className="error-message">{fileError}</p>}
        <button type="submit">프로젝트 생성</button>
      </form>
    </div>
  );
}

export default CreateFunding;