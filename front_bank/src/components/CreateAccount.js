import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './axiosConfig';

function CreateAccount() {
    const [accType, setAccType] = useState('');
    const [accpw, setAccpw] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) =>{
        e.preventDefault();
        try{
            const response = await axios.post('/makeAccount',{
                accType,
                accpw,
                accAmount: 50000 // 초기 금액 5만원 설정
            });
            alert('계좌가 성공적으로 생성되었습니다.');
            navigate('/view-accounts');
        }catch(err){
            console.log('계좌 생성 오류 : ', err );
            alert('계좌 생성에 실패했습니다.');
        }
    };

    return (
        <div>
          <h2>계좌 생성</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>계좌 유형:</label>
              <select value={accType} onChange={(e) => setAccType(e.target.value)} required>
                <option value="">선택하세요</option>
                <option value="basic">기본 계좌</option>
                <option value="funding">펀딩 계좌</option>
              </select>
            </div>
            <div>
              <label>계좌 비밀번호 (4자리):</label>
              <input
                type="password"
                value={accpw}
                onChange={(e) => setAccpw(e.target.value)}
                maxLength="4"
                pattern="\d{4}"
                required
              />
            </div>
            <button type="submit">계좌 생성</button>
          </form>
        </div>
      );
}

export default CreateAccount;