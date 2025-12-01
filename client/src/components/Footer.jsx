import { Link } from "react-router-dom";
import { FaWhatsapp,FaMapMarkerAlt,FaEnvelope } from "react-icons/fa";

const Footer = () => {
    return(
        <>
        <footer className="bg-[#243e36] text-white">
  <div className="container mx-auto px-6 py-10">

    {/* BAGIAN ATAS */}
    <div className="flex justify-between flex-wrap gap-10 pb-6 border-b border-green-700">

      {/* Kolom 1 */}
      <div className="text-left w-64">
        <h1 className="text-2xl font-bold text-yellow-300">CSSC</h1>
        <p>Platform Sumber Informasi untuk Mahasiswa dan Dosen.</p>
      </div>

      {/* Kolom 2 */}
      <div className="w-64">
        <h1 className="font-medium mb-2">Quick Links</h1>
        <div className="flex flex-col gap-1">
          <Link to="/Jadwal">Jadwal</Link>
          <Link to="/Materi">Materi</Link>
          <Link to="/Pengumuman">Pengumuman</Link>
        </div>
      </div>

      {/* Kolom 3 */}
      <div className="w-64">
        <h1 className="font-medium mb-2">Contact Us</h1>
        <p className="flex items-center gap-2"><FaWhatsapp size={20} className="text-[#42c940]" /> +6285831163191</p>
        <p className="flex items-center gap-2"><FaEnvelope size={20} className="text-[#dae96a]" /> cssc@itula.com</p>
        <p className="flex items-center gap-2"><FaMapMarkerAlt size={20} className="text-[#ec6755]" /> Medan, Indonesia</p>
      </div>
    </div>

    {/* BAGIAN BAWAH */}
    <div className="text-center mt-6 flex flex-col items-center gap-4">
      <p>&copy; 2025 CSSC</p>
      <div className="flex gap-10">
        <Link>Privacy Policy</Link>
        <Link>Terms of Service</Link>
        <Link>Support</Link>
      </div>
    </div>

  </div>
</footer>

        </>
    )
}

export default Footer;