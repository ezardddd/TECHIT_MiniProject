import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from './components/axiosConfig';
import Navbar from './components/Navbar';
import MainPage from './components/MainPage';
import SignUp from './components/SignUp';
import CreateAccount from './components/CreateAccount';
import ViewAccounts from './components/ViewAccounts';
import Transfer from './components/Transfer';
import Setup2FA from './components/Setup2FA';
import FundingList from './components/FundingList';
import FundingDetail from './components/FundingDetail';
import CreateFunding from './components/CreateFunding';
import './App.css';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/users/me');
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.data
        });
      } catch (error) {
        // 401 에러를 포함한 모든 에러를 무시하고 비인증 상태로 설정
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
    };

    checkAuth();
  }, []);

  if (authState.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar 
          isAuthenticated={authState.isAuthenticated} 
          setAuthState={setAuthState}
          user={authState.user}
        />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/create-account"
              element={authState.isAuthenticated ? <CreateAccount /> : <Navigate to="/" />}
            />
            <Route
              path="/view-accounts"
              element={authState.isAuthenticated ? <ViewAccounts /> : <Navigate to="/" />}
            />
            <Route
              path="/transfer"
              element={authState.isAuthenticated ? <Transfer /> : <Navigate to="/" />}
            />
            <Route
              path="/setup-2fa"
              element={authState.isAuthenticated ? <Setup2FA /> : <Navigate to="/" />}
            />
            <Route path="/funding" element={<FundingList />} />
            <Route path="/funding/:id" element={<FundingDetail />} />
            <Route
              path="/create-funding"
              element={authState.isAuthenticated ? <CreateFunding /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;