import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <>
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center w-full overflow-hidden"
        style={{ backgroundImage: 'url("bukuputih.png")' }}
      >
        <div className="bg-[#243e36]/80 backdrop-blur-sm rounded-3xl text-white w-[650px] max-w-xl h-[320px] flex flex-col shadow-xl overflow-hidden px-10 py-8 gap-6">
          <div className="flex justify-between items-center text-sm">
            <Link to="/Login" className="flex gap-2 items-center">
              <FaArrowLeft /> Kembali
            </Link>
          </div>
          <div className="flex flex-col gap-1 text-left">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-sm font-light">
              Masukkan email yang terdaftar untuk menerima link reset password.
            </p>
          </div>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <button
              type="submit"
              className="mt-1 px-8 self-center text-yellow-300 text-lg font-bold py-2 bg-[#1a322b] rounded-2xl"
            >
              Kirim Link Reset
            </button>
          </form>
          {sent && (
            <p className="text-xs text-center text-green-200 mt-1">
              Jika email terdaftar, link reset password telah dikirim.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
