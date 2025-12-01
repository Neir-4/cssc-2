import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Navbar = () => {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return(
        <>
            <nav className="flex fixed top-0 left-0 items-center right-0 z-50 justify-between text-[#1E1E1E] py-3 bg-white shadow-sm">
                <Link className="text-2xl font-bold ml-4 md:ml-11" to="/">CSSC</Link>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex gap-5 text-m font-semibold items-center text-center">
                    <Link to="/Jadwal" className="hover:text-amber-600 transition-colors">Jadwal</Link>
                    <Link to="/Materi" className="hover:text-amber-600 transition-colors">Materi</Link>
                    <Link to="/Pengumuman" className="hover:text-amber-600 transition-colors">Pengumuman</Link>
                </div>

                {/* Desktop Login Button */}
                <Link
                    className="hidden md:block text-lg font-bold px-3 py-1 rounded-2xl bg-yellow-300 mr-4 md:mr-11 hover:bg-yellow-400 transition-colors"
                    to={user ? "/Profile" : "/Login"}
                >
                    {user ? user.name : "Login"}
                </Link>

                {/* Mobile Hamburger Button */}
                <button 
                    className="md:hidden mr-4 p-2 focus:outline-none"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <div className="w-6 h-6 flex flex-col justify-center items-center">
                        <span className={`bg-[#1E1E1E] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                        <span className={`bg-[#1E1E1E] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                        <span className={`bg-[#1E1E1E] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
                    </div>
                </button>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed top-16 left-0 right-0 bg-white shadow-lg z-40 md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="flex flex-col p-4 space-y-4">
                    <Link 
                        to="/Jadwal" 
                        className="text-lg font-semibold hover:text-amber-600 transition-colors py-2"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Jadwal
                    </Link>
                    <Link 
                        to="/Materi" 
                        className="text-lg font-semibold hover:text-amber-600 transition-colors py-2"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Materi
                    </Link>
                    <Link 
                        to="/Pengumuman" 
                        className="text-lg font-semibold hover:text-amber-600 transition-colors py-2"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Pengumuman
                    </Link>
                    <Link
                        className="text-lg font-bold px-4 py-2 rounded-2xl bg-yellow-300 hover:bg-yellow-400 transition-colors text-center mt-4"
                        to={user ? "/Profile" : "/Login"}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {user ? user.name : "Login"}
                    </Link>
                </div>
            </div>
        </>
    )
}

export default Navbar;