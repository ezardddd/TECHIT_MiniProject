import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './axiosConfig';
import './Setup2FA.css';

function Setup2FA() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkExisting2FA();
  }, []);

  const checkExisting2FA = async () => {
    try {
      const response = await axios.get('/users/check2fa');
      setIs2FAEnabled(response.data.is2FAEnabled);
    } catch (error) {
      console.error('2FA 상태 확인 중 오류 발생:', error);
    }
  };

  const verifyExisting2FA = async () => {
    try {
      const response = await axios.post('/users/verify2fa', { token: currentToken });
      if (response.data.verified) {
        setIs2FAEnabled(false);
        setMessage('기존 2FA 인증 성공. 새로운 2FA를 설정할 수 있습니다.');
      } else {
        setMessage('기존 2FA 인증 실패. 다시 시도해주세요.');
      }
    } catch (error) {
      setMessage('2FA 확인 실패');
    }
  };

  const setup2FA = async () => {
    try {
      const response = await axios.post('/users/setup2fa');
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
    } catch (error) {
      setMessage('2FA 설정 중 오류 발생');
    }
  };

  const verify2FA = async () => {
    try {
      const response = await axios.post('/users/verify2fa', { token });
      setMessage(response.data.msg);
      if (response.data.verified) {
        alert('2FA 설정이 완료되었습니다. 메인 페이지로 이동합니다.');
        navigate('/');
      }
    } catch (error) {
      setMessage('2FA 확인 실패');
    }
  };

  return (
    <div className="page-container">
      <div className="setup-2fa-container">
        <h2>2FA 설정</h2>
        {is2FAEnabled ? (
          <div>
            <p>이미 2FA가 설정되어 있습니다. 재설정하려면 현재 2FA 코드를 입력하세요.</p>
            <input
              type="text"
              value={currentToken}
              onChange={(e) => setCurrentToken(e.target.value)}
              placeholder="현재 6자리 2FA 코드 입력"
            />
            <button onClick={verifyExisting2FA}>기존 2FA 확인</button>
          </div>
        ) : (
          <div>
            <button onClick={setup2FA}>2FA 설정 시작</button>
            {qrCode && <img src={qrCode} alt="2FA QR Code" />}
            {secret && <p>비밀 키: {secret}</p>}
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="새 6자리 토큰 입력"
            />
            <button onClick={verify2FA}>2FA 확인</button>
          </div>
        )}
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default Setup2FA;