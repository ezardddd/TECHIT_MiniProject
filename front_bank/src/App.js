import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import './App.css';  // 새로운 App.css 파일을 import합니다.

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/view-accounts" element={<ViewAccounts />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/setup-2fa" element={<Setup2FA />} />
            <Route path="/funding" element={<FundingList />} />
            <Route path="/funding/:id" element={<FundingDetail />} />
            <Route path="/create-funding" element={<CreateFunding />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;