import React from "react";
import { Link  } from "react-router-dom";
import '../../CSS/layout/Header.css';
import i18n from "../../i18n";
import logo from "../../resource/Noryangjin_logo.png"
import earth from "../../resource/earthht.png"


const Header = () => {
    return (
        <>
            <header className="header">
                <Link to={`/`}>
                    <div className="logo">
                        <img src={logo}/>
                    </div>
                </Link>
                <div>

                </div>
                <div className="admin">
                    <div className="dropdown">
                        <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src={earth} />
                        </button>
                        <ul className="dropdown-menu">
                            <li><span className="dropdown-item" onClick={() => i18n.changeLanguage("ko")}>🇰🇷 한국어</span></li>
                            <li><span className="dropdown-item" onClick={() => i18n.changeLanguage("en")}>🇺🇸 English</span></li>
                            <li><span className="dropdown-item" onClick={() => i18n.changeLanguage("it")}>🇮🇹 Italiano</span></li>
                        </ul>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
