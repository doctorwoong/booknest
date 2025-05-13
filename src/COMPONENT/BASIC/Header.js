import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../../CSS/layout/Header.css';
import i18n from "../../i18n";
import {useTranslation} from "react-i18next";

const Header = () => {
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleAdminClick = () => {
        setShowPasswordPopup(true); // 비밀번호 팝업 표시
    };

    const handlePasswordSubmit = () => {
        if (password === "7888") {
            setShowPasswordPopup(false); // 팝업 닫기
            navigate("/admin"); // Admin 페이지로 이동
        } else {
            alert(t("148"));
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handlePasswordSubmit();
        }
    };

    return (
        <>
            <header className="header">
                <Link to={`/`}>
                    <div className="logo">
                    </div>
                </Link>
                <div>

                </div>
                <div className="admin">
                    <div className="dropdown">
                        <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        </button>
                        <ul className="dropdown-menu">
                            <li><span className="dropdown-item" onClick={() => i18n.changeLanguage("ko")}>🇰🇷 한국어</span></li>
                            <li><span className="dropdown-item" onClick={() => i18n.changeLanguage("en")}>🇺🇸 English</span></li>
                            <li><span className="dropdown-item" onClick={() => i18n.changeLanguage("it")}>🇮🇹 Italiano</span></li>
                        </ul>
                    </div>
                    <b className="adminBtn" onClick={handleAdminClick}>관리자페이지</b>
                </div>
            </header>

            {showPasswordPopup && (
                <div className="password-popup">
                    <div className="popup-content">
                        <h3><b>{t("149")}</b></h3>
                        <p>{t("150")}</p>
                        <input
                            type="password"
                            value={password}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder=""
                        />
                        <div className="checkBtn">
                            <button onClick={handlePasswordSubmit}>{t("14")}</button>
                            <button onClick={() => setShowPasswordPopup(false)}>{t("15")}</button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
