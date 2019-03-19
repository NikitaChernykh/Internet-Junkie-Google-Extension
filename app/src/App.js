import React, { Component } from 'react';
import './app.css';
import Header from './components/Header/';
import Footer from './components/Footer/';
import DailySummaryDashboard from './components/DailySummaryDashboard';
class App extends Component {
  render() {
    return (
      <div className="app">
        <Header/>
        <DailySummaryDashboard/>
        <Footer/>
      </div>
    );
  }
}

export default App;
