"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "@/configs/axios.mjs";
import Swal from "sweetalert2";
import { Download, IdCard, MessageSquareWarning, ScanQrCode } from "lucide-react";
import { cryptoEncode } from "@/configs/crypto.mjs";
import Image from "next/image";
import html2canvas from "html2canvas-pro";
import Ripple from "material-ripple-effects";

export default function Home() {
  const [citizenId, setCitizenId] = useState(""); // รับค่าที่กรอก
  const [result, setResult] = useState(""); // QR Code Output
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seat, setSeat] = useState("");
  const [person, setPerson] = useState(null);
  const qrRef = useRef(null);

  const ripple = new Ripple();

  const handleCheck = async () => {
    try {
      setLoading(true);
      // กรณีไม่ได้กรอกเลขบัตร
      if (!citizenId) {
          setLoading(false);
        Swal.fire({
          title: 'ตรวจพบข้อผิดพลาด',
          text: 'กรุณากรอกหมายเลขบัตรประชาชน',
          icon: 'error',
          confirmButtonText: 'ตกลง',
        });
        return;
      }

      const output = { national_id: citizenId }

      const rs = await axios.post("/public/training", output);

      if(rs.status === 200){
        setLoading(false);
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 1);

        const data = {
          training_name: rs.data.training_name,
          expire_date: expireDate.toISOString(),
        }
        setSeat(rs.data?.result?.numbers[0]);
        setPerson(rs.data?.training_name);
        const payload = JSON.stringify(data)
        const hashData = await cryptoEncode(payload)
        setResult(JSON.stringify(hashData));
        setError("");
      }

    } catch (err) {
      setLoading(false);
      console.log(err)
      setError(err.response?.data?.message);
      Swal.fire({
        title: 'ตรวจพบข้อผิดพลาด',
        text: err.response?.data?.message,
        icon: 'error',
        confirmButtonText: 'ตกลง'
      })
      if (err?.response?.status === 502) {
        Swal.fire({
        title: 'เกิดข้อผิดพลาดกับระบบ',
        text: "ไม่สามารถเชื่อมต่อกับระบบได้",
        icon: 'error',
        confirmButtonText: 'ตกลง'
      })
      }
    }
  };

const hdlDownload = async () => {
  if (!qrRef.current) {
    console.error("Error: QR Code element reference is null.");
    return;
  }

  try {
    const clone = qrRef.current.cloneNode(true);
    clone.style.width = `${qrRef.current.offsetWidth}px`;
    clone.style.height = `${qrRef.current.offsetHeight}px`;

    const paragraphs = clone.querySelectorAll("p");
    paragraphs.forEach(p => {
      p.style.margin = "0";
      p.style.lineHeight = "1.2";
    });

    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    document.body.removeChild(clone);

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    const filename = `qr-code-id-${citizenId}.png`;
    link.download = filename;
    link.click();
  } catch (err) {
    console.error("Failed to download QR Code:", err);
    Swal.fire({
      icon: "error",
      title: "ผิดพลาด",
      text: "เกิดข้อผิดพลาดขณะดาวน์โหลด QR Code กรุณาลองใหม่อีกครั้ง",
    });
  }
};


  const isChrome = /Chrome/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  console.log("Chrome:", isChrome);   // true if Chrome
  console.log("Safari:", isSafari);   // true if Safari

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-[25rem] border border-gray-200 mx-auto p-4 bg-white rounded-2xl shadow">
      <div className="w-full border-gray-200 flex flex-col justify-center items-center my-4">
        <p className="font-bold text-xl">ระบบสร้าง QR Code เข้ากิจกรรม</p>
        <p className="text-sm text-red-500 pt-4 flex items-start"><span className="font-bold flex items-center gap-1 w-4/12"><MessageSquareWarning size={16} /> แจ้งเตือน</span>: เมื่อได้ QR Code แล้วโปรดแคปหน้าจอไว้ เพราะจะไม่สามารถสร้างใหม่ได้</p>
      </div>

      {/* <div className="border border-gray-200 shadow rounded-2xl p-4 flex flex-col gap-4"> */}
        {!result && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex gap-1 items-center">
              <IdCard size={20} strokeWidth={1.5} />
              <p className="font-semibold">กรอกหมายเลขบัตรประชาชน</p>
            </div>
              <input
                className="border border-gray-200 py-2 px-3 rounded-lg w-full"
                placeholder="หมายเลขบัตรประชาชน"
                type="tel"
                minLength="13"
                maxLength="13"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
              />
            <button
              className="bg-[#056839] mt-3 text-white px-4 py-2 rounded-lg hover:bg-[#056839] transition disabled:hover:bg-[#056839] disabled:opacity-40"
              onClick={handleCheck}
              onMouseUp={(e) => ripple.create(e, "rgba(255, 255, 255, 0.2)")}
              disabled={loading}
            >
              {!loading ? "ตรวจสอบและสร้าง QR Code" : "กำลังโหลดข้อมูล...."}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center gap-4 my-4">
            <div className="flex flex-col items-center gap-4 bg-white w-full rounded-2xl pb-4 overflow-hidden shadow" ref={qrRef}>
              <div className="w-full p-2 bg-[#056839] flex gap-2 items-center justify-around shadow h-14">
                <Image src="/image/moph-logo.png" width={50} height={50} alt="moph-logo" />
                <div className="flex flex-col gap-0">
                  <p className="font-semibold text-2xl text-white line-clamp-1 my-0 leading-none">โรงพยาบาลอากาศอำนวย</p>
                  <p className="font-semibold text-sm text-white my-0">Akatumnuay Hospital</p>
                </div>
                <ScanQrCode className="text-white" />
              </div>
              <QRCodeSVG
                value={result}
                level="M"
                size={330}
                title="QR Code"
                includeMargin
                marginSize={4}
                className="border border-[#E5E7EB] rounded-2xl shadow"
                style={{ transform: "scale(1)" }} // ป้องกัน scale ซ้อน
              />
              <div className="flex flex-col gap-1">
                <p className="text-center text-2xl font-semibold">คุณ {person}</p>
                <p className="text-center text-xl font-semibold">ที่นั่งหมายเลข <span className="font-extrabold text-2xl underline">{seat}</span></p>
              </div>

              <p className="text-[10px] text-[#99A1AF] mt-2">
                &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
              </p>
            </div>
            <button onMouseUp={(e) => ripple.create(e, "rgba(0, 0, 0, 0.2)")} className="flex items-center justify-center gap-1 bg-white text-gray-500 border border-gray-500 px-8 py-2 rounded-full hover:bg-gray-100 hover:cursor-pointer transition shadow" onClick={hdlDownload}><Download /> ดาวน์โหลด</button>
          </div>
        )}
      {/* </div> */}

      {!result && (
        <div className="flex items-center justify-center mt-5">
          <p className="text-[12px] text-gray-400">
            &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
          </p>
        </div>
      )}
    </div>
    </div>
  );
}
