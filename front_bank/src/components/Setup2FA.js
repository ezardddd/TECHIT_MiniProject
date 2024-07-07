import React, { useState } from 'react';
import axios from './axiosConfig';
import './Setup2FA.css';

function Setup2FA() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

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
    } catch (error) {
      setMessage('2FA 확인 실패');
    }
  };

  return (
    <div className="setup-2fa-container">
      <h2>2FA 설정</h2>
      <button onClick={setup2FA}>2FA 설정 시작</button>
      {qrCode && <img src={qrCode} alt="2FA QR Code" />}
      {secret && <p>비밀 키: {secret}</p>}
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="6자리 토큰 입력"
      />
      <button onClick={verify2FA}>2FA 확인</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Setup2FA;