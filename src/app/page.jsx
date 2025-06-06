"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "@/configs/axios.mjs";
import Swal from "sweetalert2";
import { Download, IdCard, QrCode, ScanQrCode } from "lucide-react";
import { toPng } from "html-to-image";
import { cryptoEncode } from "@/configs/crypto.mjs";
import Image from "next/image";
import domtoimage from 'dom-to-image-more';

export default function Home() {
  const [citizenId, setCitizenId] = useState(""); // รับค่าที่กรอก
  const [result, setResult] = useState(""); // QR Code Output
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seat, setSeat] = useState("");
  const [person, setPerson] = useState(null);
  const qrRef = useRef(null);

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
    if (!qrRef.current) return;

    try {
      const dataUrl = await domtoimage.toPng(qrRef.current, {
        quality: 1,
        cacheBust: true,
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `qr-code-id-${citizenId}.png`;
      link.click();
    } catch (err) {
      console.error("ไม่สามารถดาวน์โหลด QR Code ได้", err);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "เกิดข้อผิดพลาดขณะดาวน์โหลด QR Code",
      });
    }
  };

  return (
    <div className="max-w-[25rem] mx-auto pt-20 px-4">
      <div className="w-full border-gray-200 h-13 flex justify-center items-center">
        <p className="font-bold text-xl">ระบบสร้าง QR Code เข้ากิจกรรม</p>
      </div>

      {/* <div className="border border-gray-200 shadow rounded-2xl p-4 flex flex-col gap-4"> */}
        {!result && (
          <div className="flex flex-col gap-2 my-4">
            <div className="flex gap-1 items-center">
              <IdCard size={20} strokeWidth={1.5} />
              <p className="font-semibold">กรอกหมายเลขบัตรประชาชน</p>
            </div>
              <input
                className="border border-gray-200 py-2 px-3 rounded-lg w-full"
                placeholder="หมายเลขบัตรประชาชน"
                type="phone"
                minLength="13"
                maxLength="13"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
              />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:hover:bg-blue-500 disabled:opacity-40"
              onClick={handleCheck}
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
              <div className="w-full p-2 bg-[#056839] flex gap-2 items-center justify-around shadow">
                <Image src="/image/moph-logo.png" width={50} height={50} alt="moph-logo" />
                <div>
                  <p className="font-semibold text-2xl text-white">โรงพยาบาลอากาศอำนวย</p>
                  <p className="font-semibold text-sm text-white">Akatumnuay Hospital</p>
                </div>
                <ScanQrCode className="text-white" />
              </div>
              <QRCodeSVG
                value={result}
                level="M"
                size={256}
                title="QR Code"
                includeMargin
                marginSize={4}
                className="border border-gray-200 rounded-2xl shadow"
              />
              <div className="flex flex-col gap-1">
                <p className="text-center text-2xl font-semibold">คุณ {person}</p>
                <p className="text-center text-xl font-semibold">ที่นั่งหมายเลข <span className="font-extrabold text-2xl underline">{seat}</span></p>
              </div>

              <p className="text-[10px] text-gray-400 mt-2">
                &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
              </p>
            </div>
            <button className="flex items-center justify-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 hover:cursor-pointer transition shadow" onClick={hdlDownload}><Download /> ดาวน์โหลด</button>
          </div>
        )}
      {/* </div> */}

      {!result && (
        <div className="flex items-center justify-center">
          <p className="text-[12px] text-gray-400">
            &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
          </p>
        </div>
      )}
    </div>
  );
}
