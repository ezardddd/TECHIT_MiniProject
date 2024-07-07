import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import './Transfer.css';

function Transfer() {
    const location = useLocation();
    const navigate = useNavigate();
    const { sendAccNumber } = location.state;

    const [transferData, setTransferData] = useState({
        receiveAccNumber: '',
        amount: '',
        accpw: '',
        twoFactorToken: '' // 2FA 토큰 필드 추가
    });

    const handleChange = (e) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/accounts/transfer', {
                sendAccNumber,
                receiveAccNumber: transferData.receiveAccNumber,
                amount: parseInt(transferData.amount),
                accpw: transferData.accpw,
                twoFactorToken: transferData.twoFactorToken // 2FA 토큰 포함
            });
            alert(response.data.msg);
            navigate('/view-accounts');
        } catch (error) {
            alert(error.response?.data?.msg || "이체 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="page-container">
        <div className="transfer-container">
            <h2>계좌 이체</h2>
            <form onSubmit={handleSubmit} className="transfer-form">
                <div className="form-group">
                    <label>보내는 계좌: {sendAccNumber}</label>
                </div>
                <div className="form-group">
                    <label htmlFor="receiveAccNumber">받는 계좌</label>
                    <input
                        type="text"
                        id="receiveAccNumber"
                        name="receiveAccNumber"
                        value={transferData.receiveAccNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="amount">이체 금액</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={transferData.amount}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="accpw">계좌 비밀번호</label>
                    <input
                        type="password"
                        id="accpw"
                        name="accpw"
                        value={transferData.accpw}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="twoFactorToken">2FA 코드</label>
                    <input
                        type="text"
                        id="twoFactorToken"
                        name="twoFactorToken"
                        value={transferData.twoFactorToken}
                        onChange={handleChange}
                        required
                        placeholder="6자리 2FA 코드 입력"
                    />
                </div>
                <button type="submit" className="transfer-submit-btn">이체하기</button>
            </form>
        </div>
        </div>
    );
}

export default Transfer;