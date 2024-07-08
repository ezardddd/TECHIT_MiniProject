import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import './ViewAccounts.css';

function ViewAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transferHistory, setTransferHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get('/accounts/getAccounts');
            setAccounts(response.data);
        } catch (err) {
            console.error('계좌 조회 오류', err);
        }
    };

    const getAccountTypeText = (accType) => {
        switch(accType) {
            case 'basic':
                return '기본 계좌';
            case 'funding':
                return '펀딩 계좌';
            default:
                return '알 수 없는 계좌 유형';
        }
    };

    const handleTransfer = (accNumber) => {
        navigate('/transfer', { state: { sendAccNumber: accNumber } });
    };

    const handleViewTransferHistory = async (accNumber) => {
        try {
            const response = await axios.get(`/accounts/getTransferHistory/${accNumber}`);
            setTransferHistory(response.data);
            setSelectedAccount(accNumber);
        } catch (err) {
            console.error('이체 내역 조회 오류', err);
        }
    };

    return (
        <div className="page-container">
            <div className="view-accounts-container">
                <h2 className="view-accounts-header">내 계좌 목록</h2>
                {accounts.length === 0 ? (
                    <div className="no-accounts">
                        <p>계좌가 없습니다.</p>
                        <Link to="/create-account" className="create-account-link">계좌 생성하기</Link>
                    </div>
                ) : (
                    <ul className="accounts-list">
                        {accounts.map((account) => (
                            <li key={account.accid} className="account-item">
                                <div className="account-info">
                                    <p className="account-number">계좌번호: {account.accNumber}</p>
                                    <p className="account-type">계좌유형: {getAccountTypeText(account.accType)}</p>
                                    <p className="account-balance">잔액: {account.accAmount.toLocaleString()}원</p>
                                </div>
                                <button onClick={() => handleTransfer(account.accNumber)} className="transfer-btn">이체하기</button>
                                <button onClick={() => handleViewTransferHistory(account.accNumber)} className="transfer-history-btn">이체내역</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {selectedAccount && (
                <div className="transfer-history-container">
                    <h3>{selectedAccount} 계좌의 이체 내역</h3>
                    <table className="transfer-history-table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>유형</th>
                                <th>상대 계좌</th>
                                <th>금액</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transferHistory.map((transfer) => (
                                <tr key={transfer.transferid}>
                                    <td>{new Date(transfer.transfertime).toLocaleString()}</td>
                                    <td>{transfer.type}</td>
                                    <td>{transfer.otherAccount}</td>
                                    <td className={transfer.amount < 0 ? 'negative-amount' : 'positive-amount'}>
                                        {transfer.amount.toLocaleString()}원
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ViewAccounts;