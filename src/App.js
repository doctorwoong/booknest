import {Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import './CSS/App.css';
import Header from "./COMPONENT/BASIC/Header";
import ReservationCalendar from "./BAS/ReservationCalendar";
import ReservationForm from "./BAS/ReservationForm";
import Main from "./BAS/Main";
import Detail from "./BAS/Detail";
import Review from "./BAS/Review";
import Footer from "./COMPONENT/BASIC/Footer";
import Admin from "./SYS/Admin";
import ReviewDetail from "./BAS/ReviewDetail";
import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import InquiryDetail from "./BAS/InquiryDetail";

function getAdminPasswordFromEnv() {
    const craVal = process.env.REACT_APP_ADMIN_PASSWORD;
    return (craVal || '').trim();
}

const ADMIN_PASSWORD = getAdminPasswordFromEnv();

function App() {

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const { t } = useTranslation();

    const authenticateAdmin = (password) => {
        if (!ADMIN_PASSWORD) {
            // 환경변수 미설정 시 안내
            alert('관리자 비밀번호가 설정되지 않았습니다.');
            return false;
        }

        if (password === ADMIN_PASSWORD) {
            setIsAdminAuthenticated(true);
            return true;
        }
        alert(t("148")); // 비밀번호 오류 메시지
        return false;
    };

    return (
        <div className="app-container">
            <Header/>
            <div className="content-container">
                <Routes>
                    <Route path="/" element={<Main/>}/>
                    <Route path="/reservation-calendar" element={<ReservationCalendar/>}/>
                    <Route path="/reservation-form" element={<ReservationForm/>}/>
                    <Route path="/detail" element={<Detail/>}/>
                    <Route path="/review" element={<Review/>}/>
                    <Route path="/reviewWrite" element={<ReviewDetail/>}/>
                    <Route path="/inquiry/:id" element={<InquiryDetail />} />
                    <Route
                        path="/admin-c1w4"
                        element={
                            isAdminAuthenticated ? (
                                <Admin/>
                            ) : (
                                <PasswordPopup onAuthenticate={authenticateAdmin}/>
                            )
                        }
                    />
                </Routes>
                <Footer/>
            </div>
        </div>
    );
}

const PasswordPopup = ({ onAuthenticate }) => {
    const [password, setPassword] = useState("");
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSubmit = () => {
        const ok = onAuthenticate(password);
        if (ok) {
            navigate('/admin-c1w4', { replace: true });
        }
    };

    const handleCancel = () => {
        navigate('/', { replace: true });
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
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
                    <button onClick={handleSubmit}>{t("14")}</button>
                    <button onClick={handleCancel}>{t("15")}</button>
                </div>
            </div>
        </div>
    );
};

export default App;
