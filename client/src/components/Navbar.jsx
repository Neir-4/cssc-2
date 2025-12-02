import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Navbar = () => {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Check if link is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Navigation items
    const navItems = [
        { label: "Jadwal", path: "/Jadwal" },
        { label: "Materi", path: "/Materi" },
        { label: "Pengumuman", path: "/Pengumuman" }
    ];

    return(
        <>
            <nav className="flex fixed top-0 left-0 items-center right-0 z-50 justify-between text-[#1E1E1E] py-3 bg-white shadow-sm">
                <Link className="text-2xl font-bold ml-4 md:ml-11" to="/">CSSC</Link>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex gap-5 text-m font-semibold items-center text-center">
                    {navItems.map((item) => (
                        <Link 
                            key={item.path}
                            to={item.path} 
                            className={`pb-1 transition-all duration-200 ${
                                isActive(item.path)
                                    ? 'text-amber-600 border-b-2 border-amber-600'
                                    : 'hover:text-amber-600 border-b-2 border-transparent'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
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
                    {navItems.map((item) => (
                        <Link 
                            key={item.path}
                            to={item.path} 
                            className={`text-lg font-semibold py-2 px-2 rounded transition-colors ${
                                isActive(item.path)
                                    ? 'text-amber-600 bg-amber-50 border-l-4 border-amber-600'
                                    : 'hover:text-amber-600'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
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