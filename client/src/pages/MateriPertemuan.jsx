import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiFile, FiUpload, FiTrash2, FiEdit2, FiDownload } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const MateriPertemuan = () => {
    const { id } = useParams();
    const { user } = useAuth(); // ⬅ ambil user (dosen/mahasiswa)

    const [materialData, setMaterialData] = useState({});
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [showEdit, setShowEdit] = useState(false);

    const MEETINGS_TOTAL = 16;

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(`materi-${id}`)) || {};
        setMaterialData(stored);
    }, [id]);

    const saveToStorage = (data) => {
        localStorage.setItem(`materi-${id}`, JSON.stringify(data));
    };

    const uploadPDF = (e) => {
        if (user?.role !== "dosen") return; // ⬅ mahasiswa tidak boleh upload

        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);

        const updated = {
            ...materialData,
            [selectedMeeting]: {
                ...materialData[selectedMeeting],
                file: url,
                title: editTitle || `Materi Pertemuan ${selectedMeeting}`,
            }
        };

        setMaterialData(updated);
        saveToStorage(updated);
    };

    const deleteMaterial = (pertemuan) => {
        if (user?.role !== "dosen") return; // ⬅ mahasiswa tidak boleh hapus

        const updated = { ...materialData };
        delete updated[pertemuan];
        setMaterialData(updated);
        saveToStorage(updated);
    };

    const saveEdit = () => {
        if (user?.role !== "dosen") return; // ⬅ mahasiswa tidak boleh edit

        const updated = {
            ...materialData,
            [selectedMeeting]: {
                ...materialData[selectedMeeting],
                title: editTitle,
            }
        };
        setMaterialData(updated);
        saveToStorage(updated);
        setShowEdit(false);
    };

    return (
        <div className="min-h-screen bg-[#f5f5f0] p-6 pt-24">
            <h1 className="text-3xl font-bold mb-6">
                Materi {id.replace(/-/g, " ").toUpperCase()}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Sidebar Pertemuan */}
                <div className="bg-white p-4 rounded-xl shadow">
                    <h2 className="text-xl font-bold mb-4">Daftar Pertemuan</h2>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {[...Array(MEETINGS_TOTAL)].map((_, i) => {
                            const pertemuan = i + 1;

                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setSelectedMeeting(pertemuan);
                                        setEditTitle(materialData[pertemuan]?.title || "");
                                    }}
                                    className={`w-full p-3 text-left rounded-lg border ${
                                        selectedMeeting === pertemuan
                                            ? "bg-[#8db89a] text-white"
                                            : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                                >
                                    Pertemuan {pertemuan}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="col-span-2 bg-white p-6 rounded-xl shadow">
                    {!selectedMeeting ? (
                        <p className="text-gray-500">
                            Pilih pertemuan untuk melihat materi.
                        </p>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">
                                    Pertemuan {selectedMeeting}
                                </h2>

                                {/* Hanya dosen yang bisa upload */}
                                {user?.role === "dosen" && (
                                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer flex items-center gap-2">
                                        <FiUpload />
                                        Upload PDF
                                        <input type="file" accept="application/pdf" onChange={uploadPDF} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* Jika materi ada */}
                            {materialData[selectedMeeting]?.file ? (
                                <div className="bg-blue-50 p-4 rounded-lg border mb-4">
                                    <a
                                        href={materialData[selectedMeeting].file}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 text-blue-700 font-semibold hover:underline"
                                    >
                                        <FiFile size={24} />
                                        {materialData[selectedMeeting].title || "Materi PDF"}
                                    </a>

                                    {/* Tombol download untuk mahasiswa & dosen */}
                                    <a
                                        href={materialData[selectedMeeting].file}
                                        download={`Materi-Pertemuan-${selectedMeeting}.pdf`}
                                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg"
                                    >
                                        <FiDownload /> Download
                                    </a>
                                </div>
                            ) : (
                                <p className="text-gray-500">Belum ada file PDF.</p>
                            )}

                            {/* Edit Judul (Hanya Dosen) */}
                            {user?.role === "dosen" && (
                                <>
                                    <button
                                        onClick={() => setShowEdit(!showEdit)}
                                        className="mt-3 mb-2 px-3 py-2 bg-yellow-500 text-white rounded flex items-center gap-2"
                                    >
                                        <FiEdit2 /> Edit Judul
                                    </button>

                                    {showEdit && (
                                        <div className="mt-2">
                                            <input
                                                className="w-full p-2 border rounded"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="Judul materi..."
                                            />
                                            <button
                                                onClick={saveEdit}
                                                className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    )}

                                    {/* Hapus Materi */}
                                    <button
                                        onClick={() => deleteMaterial(selectedMeeting)}
                                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2"
                                    >
                                        <FiTrash2 /> Hapus Materi
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MateriPertemuan;
