import React, { Component } from 'react';
import './app.css';
import Header from './components/Header/';
import Footer from './components/Footer';
class App extends Component {
  render() {
    return (
      <div className="app">
        <Header/>
        <Footer/>
      </div>
    );
  }
}

export default App;
