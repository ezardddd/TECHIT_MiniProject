import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './components/MainPage';
import SignUp from './components/SignUp';
import CreateAccount from './components/CreateAccount';
import ViewAccounts from './components/ViewAccounts';
import Transfer from './components/Transfer';
import Setup2FA from './components/Setup2FA';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/view-accounts" element={<ViewAccounts />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
      </Routes>
    </Router>
  );
}

export default App;