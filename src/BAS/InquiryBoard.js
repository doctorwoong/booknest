import React, { useEffect, useState } from "react";
import { apiRequest } from "../Util/api";

const InquiryBoard = () => {
    const [inquiries, setInquiries] = useState([]);

    // useEffect(() => {
    //     const fetchInquiries = async () => {
    //         try {
    //             const data = await apiRequest("/inquiry-list", "GET");
    //             setInquiries(data);
    //         } catch (e) {
    //             console.error("문의게시판 불러오기 실패:", e);
    //         }
    //     };
    //     fetchInquiries();
    // }, []);

    return (
        <div className="inquiry-board">
            <h3>문의게시판</h3>
            <ul>
                {inquiries.map((inq) => (
                    <li key={inq.id}>
                        <b>{inq.title}</b> - {inq.author} ({inq.created_at})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InquiryBoard;
