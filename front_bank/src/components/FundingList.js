import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from './axiosConfig';
import './FundingList.css';

function FundingList() {
  const [fundingList, setFundingList] = useState([]);

  useEffect(() => {
    fetchFundingList();
  }, []);

  const fetchFundingList = async () => {
    try {
      const response = await axios.get('/funding/list');
      setFundingList(response.data);
    } catch (error) {
      console.error('펀딩 목록 조회 오류:', error);
    }
  };

  return (
    <div className="funding-list-container">
      <h2>크라우드 펀딩 프로젝트</h2>
      <Link to="/create-funding" className="create-funding-btn">새 프로젝트 만들기</Link>
      <ul className="funding-list">
        {fundingList.map((project) => (
          <li key={project.postid} className="funding-item">
            <Link to={`/funding/${project.postid}`}>
              <h3>{project.title}</h3>
              <p>{project.content.substring(0, 100)}...</p>
              <div className="funding-progress">
                <progress value={project.currentAmount} max={project.goal}></progress>
                <span>{Math.round((project.currentAmount / project.goal) * 100)}% 달성</span>
              </div>
              <p>목표액: {project.goal.toLocaleString()}원</p>
              <p>현재 모금액: {project.currentAmount.toLocaleString()}원</p>
              <p>투자자 수: {project.investorCount}명</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FundingList;