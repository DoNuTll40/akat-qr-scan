"use client";

import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import moment from "moment";
import "moment/locale/th";
import axios from "@/configs/axios.mjs";
import Swal from "sweetalert2";
import { cryptoDecode } from "@/configs/crypto.mjs";

export default function Home() {
  const [result, setResult] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [person, setPerson] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    getResult();
  }, [])

  const getResult = async () => {
    try {
      const rs = await axios.get("/public/training");

      setScore(rs.data?.sumResult);
    } catch (err) {
      console.log(err)
    }
  }

  let personPass = 0

  const hdlSubmit = async (data) => {
    try {
      Swal.fire({
        title: "กำลังบันทึกข้อมูล...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const output = { training_name: data.training_name };
      const rs = await axios.put("/public/training", output);

      setResult("Scan complete");
      setPerson({ training_name: data.training_name });
      setStatusSuccess(true);
      setStatusError(false);
      setSuccessMessage(rs.data.message);
      Swal.close();
      personPass++
    } catch (err) {
      Swal.close();
      console.error(err);
      setStatusSuccess(false);
      setStatusError(true);
      const message =
        err?.response?.data?.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      setErrorMessage(message);
      setPerson({ training_name: data?.training_name || "ไม่ทราบชื่อ" });
    }
  };

  const onScan = async (result) => {
    try {
      
      if (!result || !result[0]?.rawValue) return;

      const data = JSON.parse(result[0].rawValue);
      const decode = await cryptoDecode(data);
      if (decode?.training_name) {
        hdlSubmit(decode);
      } else {
        throw new Error("QR ไม่ถูกต้อง");
      }
    } catch (e) {
      Swal.fire({
        icon: "warning",
        title: "ไม่สามารถสแกนได้",
        text: "QR Code ไม่ถูกต้องหรือไม่มีข้อมูล",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col gap-4 shrink-0">
      {/* Header */}
      <div className="w-full border border-gray-200 shadow h-13 flex justify-between items-center px-4">
        <p>ระบบสแกน QR Code เข้ากิจกรรม</p>
      </div>

      {/* Content */}
      <div className="mx-auto min-w-[80rem] flex flex-col gap-4">
        {/* Summary */}
        <div className="w-full">
          <div className="border rounded-2xl p-4 border-gray-200 shadow flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p>จำนวน QR Code</p>
              <p>
                {moment().locale("th").add(543, "year").format("DD MMMM พ.ศ. YYYY")}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <div className="border border-gray-200 p-2 rounded-xl">
                จำนวนคิวอาร์ที่มีในระบบ {score}
              </div>
              <div>จำนวนคนที่สแกนแล้ว {personPass}</div>
            </div>
          </div>
        </div>

        {/* Scanner */}
        <div className="w-full flex flex-row rounded-2xl justify-between gap-4 border border-gray-200 p-4 shadow">
          {/* QR Scanner */}
          <div className="w-1/2 overflow-hidden shadow rounded-xl">
            <Scanner
              sound
              onScan={onScan}
              onError={(error) => console.error(error)}
              constraints={{ facingMode: "environment" }}
              containerStyle={{ width: "100%", borderRadius: "0.75rem" }}
              videoStyle={{ width: "100%", borderRadius: "0.75rem" }}
            />
          </div>

          {/* Result Panel */}
          <div className="w-1/2 p-2 px-4 border border-gray-200 shadow rounded-xl break-words">
            <p className="font-bold text-2xl my-4 text-center">
              ผลลัพธ์จาก QR Code
            </p>
            <p className="px-2 my-2 font-semibold">Scan Result</p>

            {person && (
              <div className="border w-full rounded-2xl border-gray-200 py-2 px-4">
                <p>ชื่อ: {person?.training_name}</p>
                <p>
                  สถานะ:{" "}
                  <span
                    className={
                      statusSuccess
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {statusSuccess ? "สำเร็จ" : "ไม่สำเร็จ"}
                  </span>
                </p>
                <p>
                  วันเวลา:{" "}
                  {moment()
                    .locale("th")
                    .add(543, "year")
                    .format("DD MMMM พ.ศ. YYYY เวลา HH:mm:ss น.")}
                </p>
                {!statusSuccess ? (
                  <p className="text-red-500">สาเหตุ: {errorMessage}</p>
                ) : (
                  <p className="text-green-500">หมายเหตุ: {successMessage}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center">
        <p className="text-sm text-gray-400">
          &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
        </p>
      </div>
    </div>
  );
}
