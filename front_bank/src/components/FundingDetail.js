import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import './FundingDetail.css';

function FundingDetail() {
  const [project, setProject] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [showTwoFAInput, setShowTwoFAInput] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(`/funding/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('프로젝트 상세 정보 조회 오류:', error);
    }
  };

  const handleFund = async (e) => {
    e.preventDefault();
    if (parseFloat(fundAmount) <= 0) {
      alert('펀딩 금액은 0보다 커야 합니다.');
      return;
    }
    setShowTwoFAInput(true);
  };

  const handleTwoFASubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/funding/${id}/invest`, {
        amount: fundAmount,
        twoFactorToken: twoFACode  
      });
      alert('펀딩에 성공했습니다!');
      fetchProjectDetails();
      setFundAmount('');
      setTwoFACode('');
      setShowTwoFAInput(false);
    } catch (error) {
      console.error('펀딩 에러:', error.response || error);
      if (error.response && error.response.status === 401) {
        alert('2FA 인증에 실패했습니다. 다시 시도해주세요.');
      } else {
        alert(`펀딩 중 오류가 발생했습니다: ${error.response?.data?.message || '알 수 없는 오류'}`);
      }
    }
  };

  if (!project) return <div>로딩 중...</div>;

  return (
    <div className="funding-detail-container">
      <h2>{project.title}</h2>
      <img src={project.imageUrl} alt={project.title} className="project-image" />
      <p>{project.content}</p>
      <div className="funding-progress">
        <progress value={project.currentAmount} max={project.goal}></progress>
        <span>{Math.round((project.currentAmount / project.goal) * 100)}% 달성</span>
      </div>
      <p>목표액: {project.goal.toLocaleString()}원</p>
      <p>현재 모금액: {project.currentAmount.toLocaleString()}원</p>
      <p>투자자 수: {project.investorCount}명</p>
      <p>작성자: {project.username}</p>
      {!showTwoFAInput ? (
        <form onSubmit={handleFund} className="funding-form">
          <input
            type="number"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            placeholder="펀딩 금액"
            min="1"
            required
          />
          <button type="submit">펀딩하기</button>
        </form>
      ) : (
        <form onSubmit={handleTwoFASubmit} className="funding-form">
          <input
            type="text"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value)}
            placeholder="2FA 코드 입력"
            required
          />
          <button type="submit">2FA 인증 및 펀딩하기</button>
        </form>
      )}
    </div>
  );
}

export default FundingDetail;