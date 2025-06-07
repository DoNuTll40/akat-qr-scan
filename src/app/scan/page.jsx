import ScanPage from "@/page/ScanPage";
import React, { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScanPage />
    </Suspense>
  );
}
