import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../../CSS/layout/Header.css';
import logo from '../../resource/Noryangjin_logo.png';

const Header = () => {
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleAdminClick = () => {
        setShowPasswordPopup(true); // 비밀번호 팝업 표시
    };

    const handlePasswordSubmit = () => {
        if (password === "1234") {
            setShowPasswordPopup(false); // 팝업 닫기
            navigate("/admin"); // Admin 페이지로 이동
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    };

    return (
        <>
            <header className="header">
                <Link to={`/`}>
                    <div className="logo">
                        <img src={logo} alt="Teamtoys Logo" style={{ width: "200px", height: "200px" }} />
                    </div>
                </Link>
                <div className="admin" onClick={handleAdminClick}>
                    <b>admin</b>
                </div>
            </header>

            {showPasswordPopup && (
                <div className="password-popup">
                    <div className="popup-content">
                        <h3>비밀번호 입력</h3>
                        <p>관리자만 접근 가능합니다.</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호 입력"
                        />
                        <button onClick={handlePasswordSubmit}>확인</button>
                        <button onClick={() => setShowPasswordPopup(false)}>취소</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
