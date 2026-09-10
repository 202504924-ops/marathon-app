"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type NavigationProps = {
  servantName?: string;
};

export default function Navigation({ servantName }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("marathon_user") || "{}")
      : {};

  const isFemale = user?.gender === "female";

  const items = [
    { name: "الرئيسية", path: "/servant/dashboard" },
    { name: "إضافة طفل", path: "/add-child" },
    { name: "إضافة فريق", path: "/add-team" },
    { name: "الحضور", path: "/attendance" },
    { name: "حضور القداس", path: "/mass" },
    { name: "الاعتراف", path: "/confession" },
    { name: "تعديل النقاط", path: "/points" },
  ];

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const logout = () => {
    localStorage.removeItem("marathon_user");
    router.push("/");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed right-0 top-0 h-screen w-64 bg-slate-900 text-white flex-col z-50">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">ماراثون الخدمة</h2>

          <p className="text-sm text-slate-300 mt-2">
            {isFemale
              ? `أهلاً يا تاسوني ${servantName || user?.name || ""}`
              : `أهلاً يا أستاذ ${servantName || user?.name || ""}`}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {items.map((item) => {
            const active = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-right px-4 py-3 rounded-lg transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold">ماراثون الخدمة</h2>

          <p className="text-xs text-slate-300">
            {isFemale
              ? `تاسوني ${servantName || user?.name || ""}`
              : `أستاذ ${servantName || user?.name || ""}`}
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-slate-800 px-4 py-2 rounded-lg"
        >
          ☰ القائمة
        </button>
      </header>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-slate-900 text-white flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-slate-700">
              <h2 className="font-bold">القائمة</h2>

              <button
                onClick={() => setOpen(false)}
                className="text-2xl text-slate-300"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {items.map((item) => {
                const active = pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-right px-4 py-3 rounded-lg transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-700">
              <button
                onClick={logout}
                className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}