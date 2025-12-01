import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({});
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("profileImage") || null
  );

  useEffect(() => {
    setTempData(user || {});
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleSave = () => {
    updateUser(tempData);
    setEditMode(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setProfileImage(base64);
      localStorage.setItem("profileImage", base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="pt-20 min-h-screen bg-[#f5f5f0] flex justify-center items-start px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl mt-6 sm:mt-10 border border-gray-100 overflow-hidden">

          {}
          <div className="bg-gradient-to-r from-[#8db89a] to-[#7da88a] px-6 sm:px-8 py-8 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {}
              <label className="cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-white/90 text-sm sm:text-base">
                  {user.role === "dosen" ? "Dosen" : "Mahasiswa"}
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <h2 className="text-xl font-bold mb-6 text-[#1e1e1e]">Informasi Personal</h2>

            <div className="space-y-4">
              {}
              <ProfileField
                label="Nama"
                value={tempData.name}
                editMode={editMode}
                onChange={(e) => setTempData({ ...tempData, name: e.target.value })}
              />

              {}
              <ProfileField
                label="Email"
                value={tempData.email}
                editMode={editMode}
                onChange={(e) => setTempData({ ...tempData, email: e.target.value })}
              />

              {}
              <ProfileField
                label="No HP"
                value={tempData.phone}
                editMode={editMode}
                onChange={(e) => setTempData({ ...tempData, phone: e.target.value })}
              />

              {}
              <ProfileField
                label="Peran"
                value={user.role === "dosen" ? "Dosen" : "Mahasiswa"}
                readOnly
              />

              {}
              <ProfileField
                label={user.role === "dosen" ? "NIP" : "NIM"}
                value={tempData.identityNumber}
                editMode={editMode}
                onChange={(e) =>
                  setTempData({ ...tempData, identityNumber: e.target.value })
                }
              />
            </div>

            {}
            <div className="flex justify-end mt-8 gap-3">
              {!editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
                  >
                    Edit Profil
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-6 py-3 rounded-xl bg-gray-300 hover:bg-gray-400 text-black text-sm font-semibold transition"
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition"
                  >
                    Simpan
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ProfileField = ({ label, value, editMode, onChange, readOnly = false }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3">
      <span className="font-semibold text-[#4b4b4b] text-sm sm:text-base w-full sm:w-32 mb-1 sm:mb-0">
        {label}:
      </span>

      {!editMode || readOnly ? (
        <span className="text-[#1e1e1e] text-sm sm:text-base break-all">{value}</span>
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="border px-3 py-1 rounded-lg w-full sm:w-64"
        />
      )}
    </div>
  );
};

export default Profile;
