"use client";

import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import moment from "moment";
import "moment/locale/th";
import axios from "@/configs/axios.mjs";
import Swal from "sweetalert2";
import { cryptoDecode } from "@/configs/crypto.mjs";
import { ScanQrCode } from "lucide-react";

export default function Home() {
  const [result, setResult] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [person, setPerson] = useState(null);
  const [score, setScore] = useState(0);
  const [personPass, setPersonPass] = useState(0);

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
      setPersonPass((prev) => prev + 1);
      Swal.close();
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
    <div className="font-notothai select-none">
      {/* Header */}
      <div className="border mb-5 border-gray-200 bg-white shadow h-13 flex px-4">
        <p className="font-bold text-lg flex gap-2 items-center"><ScanQrCode /> ระบบสแกน QR Code เข้ากิจกรรม</p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[80rem] flex flex-col gap-4">
        {/* Summary */}
        <div className="w-full">
          <div className="border rounded-2xl p-4 border-gray-200 shadow flex flex-col gap-2 bg-white">
            <div className="flex justify-between items-center">
              <p className="font-bold">จำนวน QR Code</p>
              <p className="font-bold">
                วันที่ {moment().locale("th").add(543, "year").format("DD MMMM พ.ศ. YYYY")}
              </p>
            </div>
            <div className="flex gap-4 justify-between items-center">
              <div className="border shadow border-gray-200 p-4 rounded-xl w-1/2">
                <p className="font-bold">คิวอาร์ที่มีในระบบ</p>
                <div className="flex justify-between items-end">
                  <p className="text-lg font-bold">จำนวน</p>
                  <p className="text-2xl font-bold">{score} คน</p>
                </div>
              </div>
              <div className="border shadow border-gray-200 p-4 rounded-xl w-1/2">
                <p className="font-bold">คิวอาร์ที่ผ่าน</p>
                <div className="flex justify-between items-end">
                  <p className="text-lg font-bold">จำนวน</p>
                  <p className="text-end text-2xl font-bold">{personPass} คน</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scanner */}
        <div className="w-full flex flex-col sm:flex-row rounded-2xl justify-between gap-4 border border-gray-200 p-4 shadow bg-white">
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
          <div className={`w-1/2 p-2 px-4 border border-gray-200 shadow rounded-xl break-words`}>
            <p className="font-bold text-2xl my-4 text-center">
              ผลลัพธ์จาก QR Code
            </p>
            <p className="px-2 my-2 font-semibold">Scan Result</p>

            {person && (
              <div className={`border w-full rounded-2xl border-gray-200 py-2 px-4 ${statusError && "bg-gradient-to-r from-red-50 to-red-100 border-red-600"} ${statusSuccess && "bg-gradient-to-r from-green-50 to-green-100 border-green-600"} shadow`}>
                <p className="font-semibold">ชื่อ: {person?.training_name}</p>
                <p className="font-semibold">
                  สถานะ :{" "}
                  <span
                    className={`font-semibold ${
                      statusSuccess
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }`}
                  >
                    {statusSuccess ? "สำเร็จ" : "ไม่สำเร็จ"}
                  </span>
                </p>
                <p className="font-semibold">
                  วันเวลา:{" "}
                  {moment()
                    .locale("th")
                    .add(543, "year")
                    .format("DD MMMM พ.ศ. YYYY เวลา HH:mm:ss น.")}
                </p>
                {!statusSuccess ? (
                  <p className="text-red-600 font-semibold">สาเหตุ : {errorMessage}</p>
                ) : (
                  <p className="text-green-600 font-semibold">หมายเหตุ : {successMessage}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center mt-5">
        <p className="text-sm text-gray-400">
          &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
        </p>
      </div>
    </div>
  );
}
