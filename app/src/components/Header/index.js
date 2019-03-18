import React, { Component } from 'react';
import "./header.css";
import { ReactComponent as Logo } from '../../logo.svg';

class Header extends Component {
    render() {
        return (
            <div className="header">
                <Logo className="logo"/>
            </div>
        );
    }
}

export default Header;