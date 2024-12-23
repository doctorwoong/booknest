import { useState } from "react";
import "../CSS/style/style.css";
import {Link, useLocation, useNavigate} from "react-router-dom";
import ReservationCalendar from "./ReservationCalendar";

let url = "/resource/img"

const hotelInfo = [
    { seq: 1, title: "C106", content: "아늑한 공간과 기본적인 편의 시설을 갖춘 합리적인 선택." , img :[
            url+"/C106/C106_001.jpeg", url+"/C106/C106_002.jpeg", url+"/C106/C106_003.jpeg" ]
        , star : 3.5 , review : 225 ,phone: "010-1234-5678"
    },
    { seq: 2, title: "C107", content: "넓고 세련된 공간으로 더욱 편안한 휴식을 제공합니다." , img :[
            url+"/C107/C107_001.jpeg", url+"/C107/C107_002.jpeg", url+"/C107/C107_003.jpeg" ]
        , star : 4 , review : 114 ,phone: "010-1234-5678"
    },
    { seq: 3, title: "C201", content: "가족 여행에 적합한 넓은 객실과 추가 침대 제공." , img :[
            url+"/C201/C201_001.jpeg", url+"/C201/C201_002.jpeg", url+"/C201/C201_003.jpeg" ]
        , star : 4.5 , review : 124 ,phone: "010-1234-5678"
    },
    { seq: 4, title: "C302", content: "최고급 가구와 프라이빗 라운지가 포함된 럭셔리한 객실." , img :[
            url+"/C302/C302_001.jpeg", url+"/C302/C302_002.jpeg", url+"/C302/C302_003.jpeg" ]
        , star : 4.1 , review : 455 ,phone: "010-1234-5678"
    },
    { seq: 5, title: "C305", content: "넓은 공간과 고급스러운 인테리어로 비즈니스 고객에게 적합." , img :[
            url+"/C305/C305_001.png", url+"/C305/C305_002.png", url+"/C305/C305_003.png" ]
        , star : 4.6 , review : 510 ,phone: "010-1234-5678"
    },
    { seq: 6, title: "C402", content: "객실 창문으로 펼쳐지는 탁 트인 바다 전망을 즐겨보세요." , img :[
            url+"/C402/C402_001.jpeg", url+"/C402/C402_002.jpeg", url+"/C402/C402_003.jpeg" ]
        , star : 4 , review : 150 ,phone: "010-1234-5678"
    },
    { seq: 7, title: "K105", content: "자연과 함께하는 휴식을 위한 푸른 산 전망의 객실." , img :[
            url+"/K105/K105_001.png", url+"/K105/K105_002.png", url+"/K105/K105_003.png" ]
        , star : 4.7 , review : 250 ,phone: "010-1234-5678"
    },
    { seq: 8, title: "N103", content: "프라이빗 테라스에서 여유로운 시간을 보낼 수 있는 객실." , img :[
            url+"/N103/N103_001.png", url+"/N103/N103_002.png", url+"/N103/N103_003.png" ]
        , star : 2 , review : 450 ,phone: "010-1234-5678"
    },
    { seq: 9, title: "N106", content: "보다 넓은 공간과 업그레이드된 시설을 자랑하는 객실." , img :[
            url+"/N106/N106_001.jpeg", url+"/N106/N106_002.jpeg", url+"/N106/N106_003.jpeg" ]
        , star : 4 , review : 224 ,phone: "010-1234-5678"
    },
    { seq: 10, title: "N202", content: "독특한 구조와 높은 천장이 돋보이는 감각적인 객실." , img :[
            url+"/N202/N202_001.jpeg", url+"/N202/N202_002.jpeg", url+"/N202/N202_003.jpeg" ]
        , star : 1 , review : 339 ,phone: "010-1234-5678"
    },
    { seq: 11, title: "R102", content: "도시의 스카이라인을 내려다볼 수 있는 최상층의 럭셔리 객실." , img :[
            url+"/R102/R102_001.png", url+"/R102/R102_002.png", url+"/R102/R102_003.png" ]
        , star : 4 , review : 775 ,phone: "010-1234-5678"
    },
];

const reviews = [
    {
        user: "현",
        date: "2024년 12월",
        text: "깨끗하고 사생활이 보장되고 편리함. 작지만 안정감이 있는 곳, 푹 쉴 수 있었음.",
    },
    {
        user: "Thanachai",
        date: "2024년 11월",
        text: "ฉันมาอยู่ที่เกาหลี 1 เดือน เข้าพักสถานที่แห่งยี้ มีสิ่งอำนวยความสะดวกครบครัน ห้องสะอาด เจ้าของที่พักให้คำแนะนำดี และสามารถเข้าเชคอินก่อนเวลาได้ด้วย",
    },
    {
        user: "Nie",
        date: "2024년 11월",
        text: "附近很多吃饭的地方很方便 离地铁也很近如果短暂住宿的话是很好的选择",
    },
];

const Main = () => {

    const location = useLocation();
    let checkInDate = location.state?.checkInDate ? new Date(location.state.checkInDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined;
    let checkOutDate = location.state?.checkOutDate ? new Date(location.state.checkOutDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined;
    let checkDate = "";

    const [showPopup, setShowPopup] = useState(false);
    const [inputPhone, setInputPhone] = useState("");
    const [selectedHotel, setSelectedHotel] = useState(null);

    const [filters, setFilters] = useState({
        startDate: checkInDate,
        endDate: checkOutDate,
        adults: 1,
    });

    if(checkInDate === undefined){
        checkDate = "날짜 선택";
    }else {
        checkDate = checkInDate + '~' + checkOutDate;
    }



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: name === "pets" ? e.target.checked : value,
        }));
    };

    const handleSearch = () => {
        console.log("Search filters:", filters);
        alert(`Searching with filters: ${JSON.stringify(filters)}`);
    };

    const navigate = useNavigate();

    const handleNavigate = (hotel) => {

        const extendedHotelData = {
            ...hotel,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            adults: filters.adults,
            children: filters.children,
        };
        // 상세 페이지로 데이터 전달
        navigate("/detail", { state: extendedHotelData });
    };

    const handleReview = (hotel) => {
        // 상세 페이지로 데이터 전달
        navigate("/review", { state: hotel });
    };

    const handleCalendar = () => {
        // 상세 페이지로 데이터 전달
        navigate("/reservation-calendar");
    };

    const handleCancelClick = (hotel) => {
        setSelectedHotel(hotel); // 선택된 호텔 저장
        setShowPopup(true); // 팝업창 표시
    };

    const handleConfirm = () => {
        if (inputPhone === selectedHotel.phone) {
            alert(`"${selectedHotel.title}" 예약이 취소되었습니다.`);
            setShowPopup(false); // 팝업창 닫기
            setInputPhone(""); // 입력 초기화
            setSelectedHotel(null); // 선택된 호텔 초기화
        } else {
            alert("입력한 전화번호가 예약 정보와 일치하지 않습니다.");
        }
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setInputPhone("");
        setSelectedHotel(null);
    };

    return (
        <div style={{overflowY: "scroll", height: "150vh"}}>
            {/* 숙박 예약 섹션 */}
            <h3>숙박 예약</h3>
            <div className="row align-items-center">
                <div className="col-md-6 mb-2">
                    <label htmlFor="startDate">예약일</label>
                    <input type="text" className="form-control" id="startDate" name="startDate" value={checkDate}
                           onClick={handleCalendar} readOnly/>
                </div>
                <div className="col-md-2 mb-2">
                    <label htmlFor="adults">성인</label>
                    <input type="number" className="form-control" id="adults" name="adults" min="1"
                           value={filters.adults} onChange={handleInputChange}/>
                </div>
                <div className="col-md-2 mb-2">
                    <button className="btn btn-primary mt-3" onClick={handleSearch}>검색</button>
                </div>
            </div>
            {/* 펜션 예약 섹션 */}
            <div className="container" style={{height: "450px", overflow: "auto"}}>
                <ul className="list-group">
                    {hotelInfo.map((hotel) => (
                        <li key={hotel.seq} className="list-group-item d-flex align-items-center">
                            <img
                                src={hotel.img[0]} // 첫 번째 이미지만 사용
                                alt={`Hotel ${hotel.title}`}
                                className="img-thumbnail me-3"
                                style={{width: "150px", height: "100px", objectFit: "cover"}}
                                onClick={() => handleNavigate(hotel)}
                            />
                            <div>
                                <h5 className="mb-1">{hotel.title}</h5>
                                <p className="mb-1">{hotel.content}</p>
                                <p className="mb-1">
                                    ★ {hotel.star} <span style={{cursor: "pointer"}}
                                                         onClick={() => handleReview(hotel)}>({hotel.review} 리뷰)</span>
                                </p>
                                <p className="mb-0"><strong>1박 기준: 29,000원 ~</strong></p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {/* 예약 확인 섹션 */}
            <br/>
            <h3>예약 확인</h3>
            <div className="row align-items-center">
                <div className="col-md-6 mb-2">
                    <label htmlFor="startDate">예약일</label>
                    <input type="text" className="form-control" id="date" name="date" value={checkDate} onClick={handleCalendar} readOnly/>
                </div>
                <div className="col-md-2 mb-2">
                    <label htmlFor="name">이름</label>
                    <input type="text" className="form-control" id="name" name="name" onChange={handleInputChange}/>
                </div>
                <div className="col-md-2 mb-2">
                    <button className="btn btn-primary mt-3" onClick={handleSearch}>검색</button>
                </div>
            </div>
            <div className="container-check mb-4" style={{height: "450px", overflow: "auto"}}>
                <ul className="list-group">
                    {hotelInfo.map((hotel) => (
                        <li key={hotel.seq} className="list-group-item d-flex align-items-center">
                            <img
                                src={hotel.img[0]} // 첫 번째 이미지만 사용
                                alt={`Hotel ${hotel.title}`}
                                className="img-thumbnail me-3"
                                style={{width: "150px", height: "100px", objectFit: "cover"}}
                                onClick={() => handleNavigate(hotel)}
                            />
                            <div>
                                <h5 className="mb-1">{hotel.title}</h5>
                                <p className="mb-1">{hotel.content}</p>
                                <p className="mb-1">
                                    ★ {hotel.star} <span style={{cursor: "pointer"}}
                                                         onClick={() => handleReview(hotel)}>({hotel.review} 리뷰)</span>
                                </p>
                                <p className="mb-0"><strong>1박 기준: 29,000원 ~</strong>
                                    <div>
                                        <button
                                            style={{
                                                backgroundColor: "#dc3545",
                                                color: "#fff",
                                                border: "none",
                                                padding: "10px 15px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                height: "40px",
                                                alignSelf: "flex-start",
                                            }}
                                            onClick={() => handleCancelClick(hotel)}
                                        >
                                            예약취소
                                        </button>
                                    </div>
                                </p>

                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 팝업창 */}
            {showPopup && (
                <div style={styles.overlay}>
                    <div style={styles.popup}>
                        <h3>예약 취소 확인</h3>
                        <p>
                            "{selectedHotel.title}" 예약을 취소하시려면
                            <br />
                            예약 시 입력한 전화번호를 입력하세요.
                        </p>
                        <input
                            type="text"
                            placeholder="전화번호 입력"
                            value={inputPhone}
                            onChange={(e) => setInputPhone(e.target.value)}
                            style={styles.input}
                        />
                        <div style={styles.buttonGroup}>
                            <button onClick={handleConfirm} style={styles.confirmButton}>
                                확인
                            </button>
                            <button onClick={handleClosePopup} style={styles.cancelButton}>
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 리뷰 섹션 */}
            <div className="container" style={{height: "300px", overflow: "auto"}}>
                <h3>Review</h3>
                <div
                    id="reviewCarousel"
                    className="carousel slide"
                    data-bs-ride="carousel"
                    style={{maxWidth: "600px", margin: "0 auto", overflow: "hidden",minHeight: "200px",}}
                >
                    <div className="carousel-inner" style={{ minHeight: "200px" }}>
                        {reviews.map((review, index) => (
                            <div
                                className={`carousel-item ${index === 0 ? "active" : ""}`}
                                key={index}
                            >
                                <div className="card mx-auto" style={{width: "30rem" ,minHeight: "150px"}}>
                                    <div className="card-body">
                                        <h5 className="card-title">{review.user}</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">
                                            {review.date}
                                        </h6>
                                        <p className="card-text">{review.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 캐러셀 컨트롤 버튼 */}
                    <button
                        className="carousel-control-prev"
                        type="button"
                        data-bs-target="#reviewCarousel"
                        data-bs-slide="prev"
                    >
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">이전</span>
                    </button>
                    <button
                        className="carousel-control-next"
                        type="button"
                        data-bs-target="#reviewCarousel"
                        data-bs-slide="next"
                    >
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">다음</span>
                    </button>
                </div>
            </div>
        </div>
    )
        ;
};

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    popup: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        maxWidth: "400px",
        width: "90%",
    },
    input: {
        width: "100%",
        padding: "10px",
        margin: "10px 0",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    buttonGroup: {
        display: "flex",
        justifyContent: "space-between",
    },
    confirmButton: {
        backgroundColor: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
    },
    cancelButton: {
        backgroundColor: "#dc3545",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
    },
};

export default Main;
