import React, { useState, useEffect } from 'react';
import axios from './axiosConfig';
import './FundingModal.css';

function FundingModal({ isOpen, onClose, onSubmit, projectId }) {
  const [fundingAccounts, setFundingAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [twoFACode, setTwoFACode] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFundingAccounts();
    }
  }, [isOpen]);

  const fetchFundingAccounts = async () => {
    try {
      const response = await axios.get('/accounts/getFundingAccounts');
      setFundingAccounts(response.data);
    } catch (error) {
      console.error('펀딩 계좌 조회 오류:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(projectId, selectedAccount, amount, twoFACode);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>펀딩하기</h2>
        <form onSubmit={handleSubmit}>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            required
          >
            <option value="">펀딩 계좌 선택</option>
            {fundingAccounts.map((account) => (
              <option key={account.accNumber} value={account.accNumber}>
                {account.accNumber} (잔액: {account.accAmount}원)
              </option>
            ))}
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="펀딩 금액"
            required
          />
          <input
            type="text"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value)}
            placeholder="2FA 코드"
            required
          />
          <button type="submit">펀딩하기</button>
        </form>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

export default FundingModal;