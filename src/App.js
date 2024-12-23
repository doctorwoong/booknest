import { Route, Routes } from 'react-router-dom';
import './CSS/App.css';
import Header from "./COMPONENT/BASIC/Header";
import Board from "./BAS/Board";
import ReservationCalendar from "./BAS/ReservationCalendar";
import ReservationForm from "./BAS/ReservationForm";
import Main from "./BAS/Main";
import Detail from "./BAS/Detail";
import Reservation from "./BAS/Reservation";
import Review from "./BAS/Review";
import Footer from "./COMPONENT/BASIC/Footer";
import Admin from "./SYS/Admin";

function App() {

    return (
        <div className="app-container">
            <Header />
            <div className="content-container">
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/reservation-calendar" element={<ReservationCalendar />} />
                    <Route path="/reservation-form" element={<ReservationForm />} />
                    <Route path="/detail" element={<Detail />} />
                    <Route path="/reservation" element={<Reservation />} />
                    <Route path="/review" element={<Review />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
                <Footer/>
            </div>
        </div>
    );
}

export default App;
