import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from './axiosConfig';

function ViewAccounts() {
    const [accounts, setAccounts] = useState([]);

    useEffect(() =>{
        fetchAccounts();
    }, []);

    const fetchAccounts = async () =>{
        try{
            const response = await axios.get('/getAccounts');
            setAccounts(response.data);
        }catch(err){
            console.error('계좌 조회 오류', err);
        }
    };

    return (
        <div>
          <h2>내 계좌 목록</h2>
          {accounts.length === 0 ? (
            <div>
              <p>계좌가 없습니다.</p>
              <Link to="/create-account">계좌 생성하기</Link>
            </div>
          ) : (
            <ul>
              {accounts.map((account) => (
                <li key={account.accid}>
                  <p>계좌번호: {account.accNumber}</p>
                  <p>계좌유형: {account.accType}</p>
                  <p>잔액: {account.accAmount}원</p>
                  <button>이체내역</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
}

export default ViewAccounts;