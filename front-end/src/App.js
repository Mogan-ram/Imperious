import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signin from './components/Signin';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Feed from './components/feed';

function App() {
  return (
    < Router >

      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feeds" element={<Feed />} />
      </Routes>
    </Router >

  );
}


export default App;