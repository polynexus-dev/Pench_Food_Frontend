import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  CreditCard,
  Download,
  CheckCircle,
  FileText,
  User,
  Coffee,
  Check,
  TrendingUp,
} from "lucide-react";

const DriverPayrollPage = () => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const payslips = [
    { id: 1, month: "April 2026", amount: "₹18,200", status: "Paid", date: "May 1, 2026", bank: "HDFC Bank (****9912)" },
    { id: 2, month: "March 2026", amount: "₹18,000", status: "Paid", date: "Apr 1, 2026", bank: "HDFC Bank (****9912)" },
    { id: 3, month: "February 2026", amount: "₹17,800", status: "Paid", date: "Mar 1, 2026", bank: "HDFC Bank (****9912)" },
  ];

  // Attendance grid mockup for May 2026
  const attendanceDays = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    let status: "Present" | "Off" | "Holiday" | "Pending" = "Present";
    
    if (day === 3 || day === 10 || day === 17 || day === 24 || day === 31) {
      status = "Off"; // Sundays
    } else if (day === 14) {
      status = "Holiday"; // Approved leave
    } else if (day > 21) {
      status = "Pending"; // Future dates
    }

    return { day, status };
  });

  const handleDownload = (id: number, month: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      // Simulate file download trigger
      const link = document.createElement("a");
      link.href = "#";
      link.setAttribute("download", `Payslip_${month.replace(" ", "_")}.pdf`);
      document.body.appendChild(link);
      alert(`Successfully generated and downloaded Pench Foods Payslip for ${month}!`);
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
            Employee Compensation
          </span>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight flex items-center gap-2">
            My Payroll & Attendance
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Monitor your daily shift attendance logs, view monthly payroll accruals, and download official payslips.
          </p>
        </div>
        <div className="px-5 py-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3 shrink-0">
          <TrendingUp className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">Accrued Current Month</span>
            <span className="text-sm font-black text-charcoal">₹18,500 (Disbursing June 1)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Attendance Calendar & Summary */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm lg:col-span-2 space-y-6">
          <div className="border-b border-silver/30 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                May 2026 Shift Attendance
              </h2>
              <p className="text-xs text-charcoal/60 mt-1">
                Visual matrix of your logged morning drops and duty status.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> 16 Present
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> 1 Leave
              </span>
            </div>
          </div>

          {/* Grid Layout of Days */}
          <div className="grid grid-cols-7 gap-3 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className="text-[10px] font-black uppercase text-charcoal/30 tracking-widest py-1">
                {dayName}
              </div>
            ))}
            {attendanceDays.map((dayItem) => {
              const { day, status } = dayItem;
              return (
                <div
                  key={day}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between min-h-[70px] transition-all relative ${
                    status === "Present"
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800"
                      : status === "Off"
                      ? "bg-silver/10 border-silver/20 text-charcoal/30 font-medium"
                      : status === "Holiday"
                      ? "bg-amber-500/5 border-amber-500/10 text-amber-800 font-bold"
                      : "bg-white border-silver/30 text-charcoal/50"
                  }`}
                >
                  <span className="text-xs font-black self-start">{day}</span>
                  {status === "Present" && (
                    <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full scale-90">
                      ON DUTY
                    </span>
                  )}
                  {status === "Holiday" && (
                    <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full scale-90">
                      LEAVE
                    </span>
                  )}
                  {status === "Off" && (
                    <span className="text-[9px] font-bold text-charcoal/40 scale-90">
                      OFF
                    </span>
                  )}
                  {status === "Pending" && (
                    <span className="text-[9px] font-medium text-charcoal/30 scale-90">
                      -
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Salaries & Download Payslips */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Salary Payslips
            </h2>
            <p className="text-xs text-charcoal/60 mt-1">
              Download your signed salary slips for financial records.
            </p>
          </div>

          <div className="space-y-4">
            {payslips.map((slip) => {
              const isDownloading = downloadingId === slip.id;
              return (
                <div
                  key={slip.id}
                  className="p-4 bg-silver/5 border border-silver/30 hover:border-primary/20 rounded-2xl flex flex-col gap-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-primary/5 rounded-xl text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-charcoal">{slip.month}</h4>
                        <p className="text-[10px] text-charcoal/40 font-bold uppercase mt-0.5">{slip.bank}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                      {slip.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-silver/20 pt-3 mt-1">
                    <div>
                      <span className="text-[9px] font-black text-charcoal/30 uppercase tracking-widest block">Disbursed Amount</span>
                      <span className="text-base font-black text-charcoal mt-0.5 block">{slip.amount}</span>
                    </div>

                    <button
                      onClick={() => handleDownload(slip.id, slip.month)}
                      disabled={isDownloading}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm outline-none focus:outline-none ${
                        isDownloading
                          ? "bg-emerald-500 text-white cursor-wait"
                          : "bg-white border border-silver text-charcoal hover:bg-silver/10 active:scale-95 cursor-pointer"
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <Check className="w-3.5 h-3.5 animate-bounce" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-primary" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverPayrollPage;
