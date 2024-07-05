import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './components/MainPage';
import SignUp from './components/SignUp';
import CreateAccount from './components/CreateAccount';
import ViewAccounts from './components/ViewAccounts';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/view-accounts" element={<ViewAccounts />} />
      </Routes>
    </Router>
  );
}

export default App;