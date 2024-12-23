import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {Link} from "react-router-dom";

function Airbnb() {
    const [items, setItems] = useState([]);

    const ref = useRef();
    const ref2 = useRef();
    const ref3 = useRef();
    const ref4 = useRef();
    const ref5 = useRef();
    const ref6 = useRef();
    const ref7 = useRef();

    const fetchAirbnb = async (city) => {
        const checkin = ref2.current?.value || '2024-11-11';
        const checkout = ref3.current?.value || '2024-11-15';
        const adults = ref4.current?.value || '2';
        const children = ref5.current?.value || '0';
        const infants = ref6.current?.value || '0';
        const pets = ref7.current?.value || '0';

        const url = `https://airbnb13.p.rapidapi.com/search-geo?location=${city}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}&infants=${infants}&pets=${pets}&page=1&currency=KRW`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '293bb3690emsh803191186d2583ap15a855jsn756797fc95f9',
                'x-rapidapi-host': 'airbnb13.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            return result.results.slice(0, 3); // 각 지역에서 하나씩만 가져오기
            console.log(result);
        } catch (error) {
            console.error(error);
            return []; // 에러 발생 시 빈 배열 반환
        }
    };

    useEffect(() => {
        // 서울, 인천, 포항 데이터 가져오기
        const loadData = async () => {
            const seoulData = await fetchAirbnb("Seoul");

            // 모든 데이터를 합쳐서 상태에 저장
            setItems([...seoulData]);
        };

        loadData();
    }, []); // 컴포넌트가 처음 로드될 때만 실행

    return (
        <>
            <div className="card-container">
                {items.map((item, index) => (
                    <div key={index} className="card-item">
                        <img
                            src={item.images[0]}
                            className="card-img-top"
                            style={{
                                width: "100%",
                                height: "300px",
                                borderRadius: "10px",
                                border: "2px solid #ccc",
                            }}
                            alt="listing"
                        />
                        <div className="card-body">
                            <h5 className="card-title">{item.city}</h5>
                            <p className="card-text">{item.name}</p>
                            <Link to="/reservation-calendar" className="btn btn-primary">
                                예약하기
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .card-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px; /* 카드들 사이의 간격 */
                    padding: 16px;
                    justify-content: center;
                }
                .card-item {
                    flex: 1 1 calc(33.33% - 32px); /* 3개씩 배치하기 위해 각 카드의 너비 지정 */
                    max-width: 300px; /* 카드 최대 너비 제한 */
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 카드 그림자 효과 */
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
            `}</style>
        </>
    );
}

export default Airbnb;
