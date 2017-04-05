import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <div className="App-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1017 450" width="100%" height="100%" shape-rendering="geometricPrecision">
              <path d="M1017.197 128.219L512.853 239.063l504.344-91.313v-19.531z" fill="#3498db"/>
              <path d="M1017.197 109.188L512.884 238.625 1017.197 129v-19.813z" fill="#2ecc71"/>
              <path d="M1017.197 89.813L512.916 238.188 1017.197 110V89.812z" fill="#f1c40f"/>
              <path d="M1017.197 70.063L512.916 237.75l504.281-147.094V70.062z" fill="#e67e22"/>
              <path d="M1016.697 50L512.884 237.313l504.313-166.407V51.531l-.5-1.531z" fill="#e74c3c"/>
              <path d="M1017.197 147l-504.375 92.5 504.375-73.25V147z" fill="#9b59b6"/>
              <path d="M0 77.286l512.911 160.683L.197 96.112z" fill="#ccc"/>
            </svg>
          </div>
          <div className="App-title">
            <h1>Dispersive</h1>
            <p className="App-subtitle">one state, several models.</p>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
