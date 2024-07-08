import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from './axiosConfig';
import './FundingDetail.css';
import FundingModal from './FundingModal';

function FundingDetail() {
  const [project, setProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id } = useParams();

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

  const handleFundingSubmit = async (projectId, accountNumber, amount, twoFACode) => {
    try {
      await axios.post(`/funding/${projectId}/invest`, {
        accountNumber,
        amount,
        twoFactorToken: twoFACode
      });
      alert('펀딩에 성공했습니다!');
      fetchProjectDetails();
      setIsModalOpen(false);
    } catch (error) {
      console.error('펀딩 오류:', error);
      alert('펀딩 중 오류가 발생했습니다.');
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
      <button onClick={() => setIsModalOpen(true)}>펀딩하기</button>
      <FundingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFundingSubmit}
        projectId={id}
      />
    </div>
  );
}

export default FundingDetail;