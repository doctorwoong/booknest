import React from "react";
import '../../CSS/layout/Header.css';
import logo from '../../resource/teamtoysLogo.png'
import {Link} from "react-router-dom";

const Header = () => {

    return (
        <header className="header">
            <Link to={`/`}>
                <div className="logo">
                    <img src={logo} alt="Teamtoys Logo" style={{width: "200px",height: "200px"}}/>
                </div>
            </Link>
            <Link to={`/admin`}>
                <div className="admin">
                    <b>admin</b>
                </div>
            </Link>
        </header>
    );
};

export default Header;
