"use client";

import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import moment from "moment";
import "moment/locale/th";
import axios from "@/configs/axios.mjs";
import Swal from "sweetalert2";
import { cryptoDecode } from "@/configs/crypto.mjs";
import { ScanQrCode } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ScanPage() {
  const [result, setResult] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [person, setPerson] = useState(null);
  const [score, setScore] = useState(0);
  const [personPass, setPersonPass] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const [userInfo, setUserInfo] = useState([]);
  const [user, setUser] = useState(null);

  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    // ดึง list กล้องทั้งหมด
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      setCameras(videoInputs);
      if (videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId); // เลือกกล้องแรกเป็น default
      }
    });
  }, []);

  useEffect(() => {
    getResult();
  }, [])

  useEffect(() => {
    fetch('/userinfo.json')
      .then((res) => res.json())
      .then((json) => {
        setUserInfo(json.userinfo);
      });
  }, []);


  useEffect(() => {
    if (!userInfo.length) return;

    const username = searchParams.get('username');
    if (!username) {
      let input = '';
      let foundUser = null;

      while (true) {
        input = prompt('ระบบสแกน QRCode (ADMIN) \nกรุณากรอกชื่อผู้ใช้งาน backoffice') || '';
        if (input === '') {
          // ผู้ใช้กด Cancel หรือไม่กรอกอะไรเลย
          router.replace('/'); // 🔁 กลับหน้าแรก
          break;
        }

        foundUser = userInfo.find((u) => u.username === input);
        if (foundUser) {
          const newParams = new URLSearchParams(searchParams.toString());
          console.log(foundUser)
          newParams.set('username', input);
          router.replace(`/scan?${newParams.toString()}`);
          break;
        } else {
          alert('ไม่พบชื่อผู้ใช้งานนี้ในระบบ');
        }
      } 
    } else {
      const found = userInfo.find((u) => u.username === username);
      if (found) setUser(found);
    }
  }, [userInfo, searchParams, router, username]);

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

      const expireTimestamp = new Date(decode.expire_date).getTime();

      if(expireTimestamp < Date.now()) {
        throw new Error("QR Code ของคุณหมดอายุแล้ว");
      }

      if (decode?.training_name) {
        hdlSubmit(decode);
      } else {
        throw new Error("QR Code ของคุณไม่ถูกต้อง");
      }
    } catch (e) {
      Swal.fire({
        icon: "warning",
        title: "ไม่สามารถสแกนได้",
        text: e.message || "Code ไม่ถูกต้องหรือไม่มีข้อมูล",
        confirmButtonText: "ตกลง",
      });
    }
  };

  function getDisplayName(fullname) {
    const prefixes = ['นาย', 'นางสาว', 'นาง', 'น.ส.', 'ด.ช.', 'ด.ญ.', 'น.ส', 'นางฯ']; // เพิ่มเติมได้
    let name = fullname;

    for (const prefix of prefixes) {
      if (fullname.startsWith(prefix)) {
        name = fullname.slice(prefix.length).trim();
        break;
      }
    }

    return name; // ได้ชื่อ-นามสกุลแบบไม่มีคำนำหน้า
  }

  const displayName = getDisplayName(user?.fullname || '');
  const avatarUrl = `https://ui-avatars.com/api/?format=svg&name=${encodeURIComponent(displayName)}&background=random&color=random&bold=true&size=128`;

  if (!username) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <div className="w-12 h-12 border-6 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-bold text-gray-600">เตรียมตัวให้พร้อม! กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="font-notothai select-none">
      {/* Header */}
      <div className="border mb-5 border-gray-200 bg-white shadow justify-between flex px-4 py-1">
        <p className="font-bold text-lg flex gap-2 items-center"><ScanQrCode /> ระบบสแกน QR Code เข้ากิจกรรม</p>
        <div className="shadow p-1 sm:pr-4  text-sm rounded-md flex gap-1">
          <img className="max-w-10 rounded-sm shadow pointer-events-none" src={avatarUrl} alt="profile" />
          <div className="font-semibold hidden sm:flex flex-col justify-center">
            <p className="font-extrabold">{user?.fullname}</p>
            <p className="text-xs">ตำแหน่ง {user?.position}</p>
          </div>
        </div>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="border shadow border-gray-200 p-4 rounded-xl w-full sm:w-1/2">
                <p className="font-bold">คิวอาร์ที่มีในระบบ</p>
                <div className="flex justify-between items-end">
                  <p className="text-lg font-bold">จำนวน</p>
                  <p className="text-2xl font-bold">{score} คน</p>
                </div>
              </div>
              <div className="border shadow border-gray-200 p-4 rounded-xl w-full sm:w-1/2">
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
          
          <div className="w-full sm:w-1/2 overflow-hidden shadow rounded-xl relative">
            <Scanner
              sound
              onScan={onScan}
              onError={(error) => console.error(error)}
              constraints={{ deviceId: selectedDeviceId }}
              containerStyle={{ width: "100%", borderRadius: "0.75rem" }}
              videoStyle={{ width: "100%", borderRadius: "0.75rem" }}
            />
            <select
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                value={selectedDeviceId || ""}
                className=" absolute top-0"
            >
                {cameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId}`}
                </option>
                ))}
            </select>
          </div>

          {/* Result Panel */}
          <div className={`w-full sm:w-1/2 p-2 px-4 border border-gray-200 shadow rounded-xl break-words`}>
            <p className="font-bold text-lg sm:text-2xl my-2 sm:my-4 text-center">
              ผลลัพธ์จาก QR Code
            </p>
            <p className="px-2 my-2 font-semibold text-sm sm:text-base">Scan Result</p>

            {person && (
              <div className={`border w-full text-sm sm:text-base rounded-2xl border-gray-200 py-2 px-4 ${statusError && "bg-gradient-to-r from-red-50 to-red-100 border-red-600"} ${statusSuccess && "bg-gradient-to-r from-green-50 to-green-100 border-green-600"} shadow`}>
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
      <div className="flex items-center justify-center my-5 pb-5">
        <p className="text-sm text-gray-400">
          &copy; Copyright 2025 กลุ่มงานสุขภาพดิจิทัล โรงพยาบาลอากาศอำนวย
        </p>
      </div>
    </div>
  );
}
