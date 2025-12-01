import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";


const Home = () => {
    return(
        <>
        <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
  
  {/* CONTAINER UTAMA GAMBAR */}
  <div 
    className="relative w-full max-w-7xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden bg-amber-600 bg-cover bg-center"
    style={{ backgroundImage: 'url("kelas.png")' }}
  >
    
    {/* OVERLAY GELAP (Agar teks terbaca jelas di HP) */}
    <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

    {/* BAGIAN 1: JUDUL / TEKS (Pojok Kiri Atas) */}
    <div className="absolute top-6 left-6 sm:top-10 sm:left-10 md:top-16 md:left-16 max-w-[80%] sm:max-w-md lg:max-w-lg z-10">
      <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-yellow-300 drop-shadow-md">
        CSSC
      </h1>
      <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-yellow-300 drop-shadow-md mb-2">
        CompScie Smart Class
      </h2>
      <p className="text-sm sm:text-lg lg:text-xl font-medium text-white drop-shadow-md leading-relaxed">
        Platform Sumber Informasi untuk Mahasiswa dan Dosen.
      </p>
    </div>

    {/* BAGIAN 2: LOGIN BOX */}
    {/* Mobile: Posisinya di Bawah Tengah (Inset-x-0). Desktop: Posisinya di Kanan Bawah (Right-20) */}
    <div className="absolute z-20 
      bottom-6 left-4 right-4            /* Mobile: Nempel bawah, kiri kanan ada jarak */
      md:bottom-16 md:right-16 md:left-auto /* Desktop: Pojok kanan bawah, kiri auto */
    ">
      <div className="flex flex-col items-center gap-3 p-4 bg-[#243e36]/80 backdrop-blur-sm rounded-2xl border border-[#7ca982] shadow-lg">
        <span className="text-white font-medium text-sm sm:text-lg">Masuk sebagai</span>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Link 
            to="/Login" 
            className="flex-1 sm:flex-none px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-[#1e1e1e] font-bold text-sm sm:text-lg rounded-xl text-center transition-colors"
          >
            Mahasiswa
          </Link>
          <Link 
            to="/Login" 
            className="flex-1 sm:flex-none px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-[#1e1e1e] font-bold text-sm sm:text-lg rounded-xl text-center transition-colors"
          >
            Dosen
          </Link>
        </div>
      </div>
    </div>

  </div>
</div>
           <div className="max-w-7xl mx-auto px-4 mb-10">
  <div className="relative bg-gradient-to-r from-white to-[#9ddf87] h-[50vh] md:h-[60vh] w-full rounded-2xl overflow-hidden flex items-center shadow-md">
    <div className="relative z-10 w-full md:w-3/5 px-6 md:px-12 flex flex-col gap-4">
      <div className="text-[#1e1e1e] flex flex-col gap-3">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">
          Akses Jadwal Kuliah dengan Mudah!
        </h1>
        <p className="text-sm md:text-lg font-normal leading-relaxed max-w-md">
          Lihat agenda perkuliahan setiap hari dengan cepat dan akurat. Kamu tidak akan ketinggalan pertemuan penting lagi.
        </p>
      </div>

      <div className="text-[#1e1e1e] text-left mt-2">
        <p className="text-base font-medium mb-2">Lihat Jadwal Kuliah</p>
        <Link 
          to="/Jadwal" 
          className="text-base md:text-lg font-bold px-6 py-3 bg-amber-300 rounded-full inline-flex items-center gap-2 hover:bg-amber-300 hover:-translate-y-1 hover:shadow-xl 
                        transition-all duration-300"
        >
          Jadwal <FaArrowRight />
        </Link>
      </div>
    </div>
    <img 
      src="buku.png" 
      alt="buku" 
      className="
        absolute top-0 right-0  h-full w-1/2  object-cover object-left opacity-80  md:opacity-100 transform transition-transform duration-700 hover:scale-105
      "
    />

    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent pointer-events-none md:hidden"></div>
  </div>
</div>
<div className="relative w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
  
  <div className="max-w-7xl mx-auto flex flex-col items-center gap-8 sm:gap-12">

    <div className="text-center flex flex-col gap-4 max-w-3xl mx-auto">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
        Semua Materi, Dalam Satu Klik.
      </h2>
      <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
        Materi dosen tiap pertemuan bisa kamu lihat langsung di sini. Mulai dari file PDF, slide, sampai catatan tambahan, semua siap kamu pelajari kapanpun kamu butuh.
      </p>
    </div>

    <div className="relative w-full max-w-5xl group">
      
      <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5">
        <img 
          src="materi.png" 
          alt="materi kuliah" 
          className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* GRADIENT OVERLAY: Agar tombol di bawah selalu terlihat jelas walau gambarnya terang */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-full flex justify-center px-4">
        <Link 
          to="/Materi" 
          className="
            bg-yellow-400 text-gray-900 
            font-bold text-base sm:text-lg lg:text-xl 
            px-8 py-3 sm:py-4 
            rounded-full 
            shadow-lg shadow-yellow-400/30 
            hover:bg-yellow-300 hover:-translate-y-1 hover:shadow-xl hover:scale-105
            transition-all duration-300 ease-in-out
            backdrop-blur-sm
            flex items-center gap-2
          "
        >
          Mulai Akses Materi
          {/* Ikon panah opsional untuk mempercantik */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

    </div>

  </div>
</div>
      <div className="relative w-full py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
        
        {/* === 1. BAGIAN GAMBAR === */}
        {/* Mobile: Order 2 (Di Bawah), Desktop: Order 1 (Di Kiri) */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative">
                {/* Efek blob/lingkaran kuning di belakang gambar sebagai hiasan */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/50 rounded-full blur-3xl -z-10"></div>
                
                <img 
                    src="speaker.png" 
                    alt="Speaker Pengumuman" 
                    className="w-full max-w-xs sm:max-w-sm lg:max-w-md object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
                />
            </div>
        </div>

        {/* === 2. BAGIAN TEKS === */}
        {/* Mobile: Order 1 (Di Atas), Desktop: Order 2 (Di Kanan) */}
        {/* Alignment: Mobile Center, Desktop Left (agar nyambung sama gambar di kirinya) */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 text-center lg:text-left order-1 lg:order-2">
            
            <div className="flex flex-col gap-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1e1e1e] leading-tight">
                    Informasi Terbaru dari <span className="text-amber-500">Dosen</span> & Komting
                </h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
                    Jangan lewatkan pengumuman penting mengenai jadwal kuliah, tugas, maupun kegiatan akademik lainnya. Semua informasi terbaru akan selalu diperbarui disini.
                </p>
            </div>

            <div className="flex flex-col items-center lg:items-start gap-4 mt-2">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Cek Sekarang
                </p>
                
                <Link 
                    to="/Pengumuman" 
                    className="
                        inline-flex items-center gap-3
                        bg-amber-400 text-[#1e1e1e] 
                        text-lg font-bold 
                        px-8 py-3 
                        rounded-full 
                        shadow-lg shadow-amber-400/30 
                        hover:bg-amber-300 hover:-translate-y-1 hover:shadow-xl 
                        transition-all duration-300
                    "
                >
                    Lihat Pengumuman
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </Link>
            </div>

        </div>

    </div>
</div>
        </>
    )
}
export default Home;