import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaChalkboardTeacher, FaBookOpen, FaChevronRight, FaCalendarAlt } from "react-icons/fa";

// Data Materials (Saya tambahkan properti 'color' agar seragam dengan halaman sebelumnya)
const MATERIALS = {
  "pemrograman-website": {
    title: "Pemrograman Website",
    image: "pemweb.png",
    pengajar: "Dr. Dewi Sartika Br Ginting S.Kom | Nurrahmadiayah M.Kom",
    meetings: 15,
    color: "bg-blue-100 text-blue-600",
    iconColor: "text-blue-500"
  },
  "struktur-data": {
    title: "Struktur Data",
    image: "sd.png",
    pengajar: "Anandhini Medianty Nababan S.Kom., M.T | Insidini Fawwaz M.Kom",
    meetings: 14,
    color: "bg-emerald-100 text-emerald-600",
    iconColor: "text-emerald-500"
  },
  "basis-data": {
    title: "Basis Data",
    image: "basdat.png",
    pengajar: "Dr. Dewi Sartika Br Ginting S.Kom., M.Kom | Insidini Fawwaz M.Kom",
    meetings: 16,
    color: "bg-purple-100 text-purple-600",
    iconColor: "text-purple-500"
  },
  "wirausaha-digital": {
    title: "Wirausaha Digital",
    image: "wirdig.png",
    pengajar: "Dr. T. Henny Febriana Harumy S.Kom., M.Kom",
    meetings: 12,
    color: "bg-orange-100 text-orange-600",
    iconColor: "text-orange-500"
  },
  "kecerdasan-buatan": {
    title: "Kecerdasan Buatan",
    image: "ai.png",
    pengajar: "Dr. Amalia S.T., M.T. | Dr. Pauzi Ibrahim Nainggolan S.Komp",
    meetings: 15,
    color: "bg-indigo-100 text-indigo-600",
    iconColor: "text-indigo-500"
  },
  "etika-profesi": {
    title: "Etika Profesi",
    image: "etprof.png",
    pengajar: "Dr. Ir. Elviawaty Muisa Zamzami S.T., M.T.",
    meetings: 10,
    color: "bg-rose-100 text-rose-600",
    iconColor: "text-rose-500"
  },
  "ielts-preparation": {
    title: "IELTS Preparation",
    image: "ielts.png",
    pengajar: "Drs. Yulianus Harefa GradDipEd TESOL., MEd TESOL",
    meetings: 20,
    color: "bg-teal-100 text-teal-600",
    iconColor: "text-teal-500"
  },
  "komputerisasi-ekonomi-bisnis": {
    title: "Komputerisasi Ekonomi & Bisnis",
    image: "kompre.png",
    pengajar: "Taufik Akbar Parluhutan SE, M.Si",
    meetings: 14,
    color: "bg-cyan-100 text-cyan-600",
    iconColor: "text-cyan-500"
  },
  "praktikum-pemrograman-website": {
    title: "Praktikum Pemrograman Website",
    image: "iklc 1.png",
    pengajar: "Asisten Lab Komputer",
    meetings: 15,
    color: "bg-yellow-100 text-yellow-600",
    iconColor: "text-yellow-500"
  },
  "praktikum-struktur-data": {
    title: "Praktikum Struktur Data",
    image: "iklc 1.png",
    pengajar: "Asisten Lab Komputer",
    meetings: 14,
    color: "bg-yellow-100 text-yellow-600",
    iconColor: "text-yellow-500"
  },
  "praktikum-basis-data": {
    title: "Praktikum Basis Data",
    image: "iklc 1.png",
    pengajar: "Asisten Lab Komputer",
    meetings: 16,
    color: "bg-yellow-100 text-yellow-600",
    iconColor: "text-yellow-500"
  },
};

const MateriDetail = () => {
  const { id } = useParams();
  const materi = MATERIALS[id];

  // Handling jika materi tidak ditemukan (404 State)
  if (!materi) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBookOpen className="text-gray-400 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Materi Tidak Ditemukan</h1>
          <p className="mb-6 text-sm text-gray-500">
            Halaman yang kamu cari mungkin telah dihapus atau URL salah.
          </p>
          <Link
            to="/Materi"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#1e1e1e] hover:bg-amber-500 transition-colors w-full"
          >
            <FaArrowLeft />
            Kembali ke Daftar Materi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <nav className="mb-8 flex items-center">
          <Link
            to="/Materi"
            className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-amber-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-amber-400 transition-colors shadow-sm">
                <FaArrowLeft className="text-xs" />
            </div>
            <span>Kembali ke Daftar Materi</span>
          </Link>
        </nav>

        {/* HEADER CARD: Informasi Mata Kuliah */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-10 relative overflow-hidden">
            {/* Hiasan Background */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none ${materi.color?.split(" ")[0] || "bg-gray-200"}`}></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                
                {/* Icon Box */}
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner overflow-hidden ${materi.color || "bg-gray-100"}`}>{materi.image && !materi.image.includes("iklc") ? (
            <img 
            src={`/${materi.image}`} 
            alt="icon" 
            className="w-full h-full object-cover" 
            onError={(e) => e.target.style.display='none'}/>) : (<FaBookOpen className="text-3xl md:text-4xl opacity-50" />)}
</div>
                {/* Text Info */}
                <div className="flex-1">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                        {materi.title}
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        {/* Pengajar */}
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-gray-100 rounded-lg">
                                <FaChalkboardTeacher className="text-gray-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Dosen Pengampu</p>
                                <p className="text-sm md:text-base font-medium text-gray-700 leading-relaxed max-w-md">
                                    {materi.pengajar}
                                </p>
                            </div>
                        </div>

                        {/* Total Pertemuan */}
                        <div className="flex items-start gap-3">
                             <div className="mt-1 p-2 bg-gray-100 rounded-lg">
                                <FaCalendarAlt className="text-gray-500 text-lg" />
                            </div>
                             <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Sesi</p>
                                <p className="text-sm md:text-base font-medium text-gray-700">
                                    {materi.meetings} Pertemuan
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* LIST PERTEMUAN (Grid Layout) */}
        <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-amber-400 rounded-full block"></span>
                Daftar Pertemuan
            </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {Array.from({ length: materi.meetings }, (_, index) => (
            <Link
              key={index + 1}
              to={`/Materi/${id}/pertemuan-${index + 1}`}
              className="group relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all duration-300 flex items-center justify-between overflow-hidden"
            >
              {/* Progress Bar Hiasan di kiri */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-100 group-hover:bg-amber-400 transition-colors"></div>

              <div className="flex items-center gap-4 pl-3">
                {/* Icon Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-amber-100 transition-colors`}>
                    <FaBookOpen className={`text-gray-400 group-hover:text-amber-600 text-sm`} />
                </div>
                
                <div>
                    <h3 className="text-gray-900 font-bold text-lg group-hover:text-amber-600 transition-colors">
                        Pertemuan {index + 1}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-500">
                        Klik untuk akses materi
                    </p>
                </div>
              </div>

              {/* Arrow Icon */}
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-white transition-all transform group-hover:translate-x-1">
                 <FaChevronRight className="text-xs text-gray-400 group-hover:text-white" />
              </div>

            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MateriDetail;