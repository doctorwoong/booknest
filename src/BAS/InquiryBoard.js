import React, { useEffect, useState } from "react";
import { apiRequest } from "../Util/api";
import { useNavigate } from "react-router-dom";
import "../CSS/style/inquiry.css";

const InquiryBoard = () => {
    const [inquiries, setInquiries] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        title: "",
        content: "",
    });

    const [authModal, setAuthModal] = useState(false); // 인증 모달
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [authInput, setAuthInput] = useState("");
    const navigate = useNavigate();

    // 페이지네이션 state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 문의글 조회
    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const data = await apiRequest("/inquiry-list", "GET");
                setInquiries(data.data || []);
            } catch (e) {
                console.error("문의게시판 불러오기 실패:", e);
            }
        };
        fetchInquiries();
    }, []);

    // 입력 핸들러
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // 제출
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiRequest("/inquiry-insert", "POST", form);
            if (res.success) {
                alert("문의가 등록되었습니다!");
                setModalOpen(false);
                setForm({ name: "", phone: "", email: "", title: "", content: "" });

                // 새로고침
                const data = await apiRequest("/inquiry-list", "GET");
                setInquiries(data.data || []);
                setCurrentPage(1); // 첫 페이지로 이동
            } else {
                alert("문의 등록 실패");
            }
        } catch (e) {
            console.error("문의 등록 실패:", e);
            alert("문의 등록 중 오류 발생");
        }
    };

    // 페이지네이션 계산
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = inquiries.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(inquiries.length / itemsPerPage);

    // 상세 접근 시도
    const handleInquiryClick = (inq) => {
        setSelectedInquiry(inq);
        setAuthModal(true);
        setAuthInput("");
    };

    // 인증 처리
    const handleAuthSubmit = () => {
        if (!selectedInquiry) return;

        const phone = selectedInquiry.PHONE || "";
        const last4 = phone.slice(-4);

        if (authInput === process.env.REACT_APP_ADMIN_PASSWORD) {
            navigate(`/inquiry/${selectedInquiry.ID}`, { state: { isAdmin1231: "admin2" } });
        } else if (authInput === last4) {
            navigate(`/inquiry/${selectedInquiry.ID}`, { state: { isAdmin1231: "user" } });
        }else {
            alert("전화번호 뒷자리가 일치하지 않습니다.");
        }

    };

    return (
        <div className="inquiry-board">
            <div className="inquiry-head">
                <h3><b>문의게시판</b></h3>
                <div>
                    <button className="inquiry-button" onClick={() => setModalOpen(true)}>
                        문의하기
                    </button>
                </div>
            </div>


            <ul className="inquiry-list">
                <li className="inquiry-list-header">
                    <span className="col-num">No</span>
                    <span className="col-title">제목</span>
                    <span className="col-writer">작성자</span>
                    <span className="col-date">등록일</span>
                </li>

                {currentItems.map((inq, idx) => (
                    <li
                        key={inq.ID}
                        onClick={() => handleInquiryClick(inq)}
                        className="inquiry-item"
                    >
                      <span className="col-num">
                        {inquiries.length - (indexOfFirst + idx)}
                      </span>
                        <span className="col-title">{inq.TITLE}</span>
                        <span className="col-writer">{inq.NAME}</span>
                        <span className="col-date">{inq.REG_DTM}</span>
                    </li>
                ))}
            </ul>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination">
                    {Array.from({length: totalPages}, (_, idx) => (
                        <button
                            key={idx + 1}
                            className={`page-btn ${currentPage === idx + 1 ? "active" : ""}`}
                            onClick={() => setCurrentPage(idx + 1)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* 작성 모달 */}
            {modalOpen && (
                <div className="inquiry-modal-overlay">
                    <div className="inquiry-modal">
                        <h3>문의 작성</h3>
                        <form onSubmit={handleSubmit} className="inquiry-form">
                            <input type="text" name="name" placeholder="이름" value={form.name} onChange={handleChange}
                                   required/>
                            <input type="text" name="phone" placeholder="전화번호" value={form.phone}
                                   onChange={handleChange} required/>
                            <input type="email" name="email" placeholder="이메일" value={form.email}
                                   onChange={handleChange} required/>
                            <input type="text" name="title" placeholder="제목" value={form.title} onChange={handleChange}
                                   required/>
                            <textarea name="content" placeholder="내용" value={form.content} onChange={handleChange}
                                      required/>
                            <div className="form-buttons">
                                <button type="submit" className="submit-btn">등록</button>
                                <button type="button" className="cancel-btn" onClick={() => setModalOpen(false)}>닫기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 인증 모달 */}
            {authModal && (
                <div className="inquiry-modal-overlay">
                    <div className="inquiry-modal">
                        <h3>접근 인증</h3>
                        <div className="inquiry-form">
                            <input
                                type="password"
                                placeholder="전화번호 뒷자리 4자리"
                                value={authInput}
                                onChange={(e) => setAuthInput(e.target.value)}
                                style={{marginBottom:'10px'}}
                            />
                        </div>

                        <div className="form-buttons">
                            <button className="cancel-btn" onClick={() => setAuthModal(false)}>취소</button>
                            <button className="submit-btn" onClick={handleAuthSubmit}>확인</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiryBoard;
