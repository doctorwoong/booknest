import {Navigate, Route, Routes} from 'react-router-dom';
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
import {useState} from "react";

function App() {

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

    const authenticateAdmin = (password) => {
        if (password === "1234") {
            setIsAdminAuthenticated(true);
            return true;
        }
        alert("비밀번호가 틀렸습니다.");
        return false;
    };

    return (
        <div className="app-container">
            <Header />
            <div className="content-container">
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/reservation-calendar" element={<ReservationCalendar />} />
                    <Route path="/reservation-form" element={<ReservationForm />} />
                    <Route path="/detail" element={<Detail />} />
                    <Route path="/review" element={<Review />} />
                    <Route path="/reviewWrite" element={<ReviewDetail />} />
                    <Route
                        path="/admin"
                        element={
                            isAdminAuthenticated ? (
                                <Admin />
                            ) : (
                                <PasswordPopup onAuthenticate={authenticateAdmin} />
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

    const handleSubmit = () => {
        if (onAuthenticate(password)) {
            return <Navigate to="/admin" />;
        }
    };

    return (
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
                <button onClick={handleSubmit}>확인</button>
            </div>
        </div>
    );
};

export default App;
