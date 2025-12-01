import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        role: "",
        identityNumber: "",
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleToggle = (role) => {
        setForm((prev) => ({
            ...prev,
            role: prev.role === role ? "" : role,
            identityNumber: prev.role === role ? "" : prev.identityNumber,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!form.role) {
            setError("Pilih peran Anda: Dosen, Komting, atau Mahasiswa.");
            return;
        }
        if (!form.identityNumber) {
            setError("Masukkan NIP atau NIM sesuai pilihan.");
            return;
        }

        register(form);
        const from = location.state?.from?.pathname || "/Profile";
        navigate(from, { replace: true });
    };

    const identityLabel =
        form.role === "dosen" ? "NIP" : 
        form.role === "komting" ? "NIM" :
        form.role === "mahasiswa" ? "NIM" : "Nomor Identitas";

    return (
        <>
            <div
                className="min-h-screen bg-cover bg-center flex items-center justify-center w-full overflow-hidden"
                style={{ backgroundImage: 'url("bukuputih.png")' }}
            >
                <div className="bg-[#243e36]/80 backdrop-blur-sm rounded-3xl text-white w-[950px] max-w-5xl h-[480px] flex shadow-xl overflow-hidden">
                    <div className="w-[40%] h-full hidden md:block">
                        <img src="loginpunya.png" alt="bgregister" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center px-12 gap-5">
                        <div className="flex justify-between items-center">
                            <Link to="/Login" className="flex gap-2 items-center text-sm">
                                <FaArrowLeft /> Kembali
                            </Link>
                        </div>
                        <div className="flex flex-col gap-2 text-left">
                            <h1 className="text-3xl font-bold">Selamat Datang</h1>
                            <h1 className="text-lg font-light">Daftar untuk lanjut.</h1>
                        </div>
                        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                            <div>
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Nama"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="No Hp"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                            <div className="border border-yellow-300 rounded-md overflow-hidden mt-1">
                                <div className="flex text-sm text-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRoleToggle("dosen")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 ${form.role === "dosen" ? "bg-yellow-300 text-[#243e36]" : "bg-transparent"}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.role === "dosen"}
                                            readOnly
                                            className="w-3 h-3 accent-[#243e36] bg-transparent border-white"
                                        />
                                        <span>Dosen</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRoleToggle("komting")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 border-l border-yellow-300 ${form.role === "komting" ? "bg-yellow-300 text-[#243e36]" : "bg-transparent"}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.role === "komting"}
                                            readOnly
                                            className="w-3 h-3 accent-[#243e36] bg-transparent border-white"
                                        />
                                        <span>Komting</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRoleToggle("mahasiswa")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 border-l border-yellow-300 ${form.role === "mahasiswa" ? "bg-yellow-300 text-[#243e36]" : "bg-transparent"}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.role === "mahasiswa"}
                                            readOnly
                                            className="w-3 h-3 accent-[#243e36] bg-transparent border-white"
                                        />
                                        <span>Mahasiswa</span>
                                    </button>
                                </div>
                            </div>
                            {form.role && (
                                <div>
                                    <input
                                        className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none mt-1"
                                        type="text"
                                        id="identityNumber"
                                        name="identityNumber"
                                        value={form.identityNumber}
                                        onChange={handleChange}
                                        placeholder={identityLabel}
                                        required
                                    />
                                </div>
                            )}
                            {error && (
                                <p className="text-xs text-red-200 text-left mt-1">{error}</p>
                            )}
                            <div className="flex flex-col gap-2 mt-2 items-center">
                                <button
                                    type="submit"
                                    className="px-10 text-yellow-300 text-xl font-bold py-2 bg-[#1a322b] rounded-2xl"
                                >
                                    Daftar
                                </button>
                                <div className="flex text-xs items-center justify-center gap-1">
                                    <h1>Sudah punya akun?</h1>
                                    <Link className="font-bold hover:underline" to="/Login">Login sekarang</Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
